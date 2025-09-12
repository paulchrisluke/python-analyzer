"""
Equipment data extractor for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
import subprocess
import json
import re
from decimal import Decimal, InvalidOperation
from .base_extractor import BaseExtractor
from ..utils.file_utils import FileUtils
from ..utils.field_mapping_utils import FieldMappingRegistry

logger = logging.getLogger(__name__)

class EquipmentExtractor(BaseExtractor):
    """Extractor for equipment data from PDF files."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize equipment extractor.
        
        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self.equipment_data = {}
        self.field_mapping_registry = FieldMappingRegistry()
        
    def extract(self) -> Dict[str, Any]:
        """
        Extract equipment data from PDF files.
        
        Returns:
            Dict containing extracted equipment data
        """
        logger.info("Starting equipment data extraction...")
        
        # Check if path is empty and skip extraction if so
        if not self.config.get('path', '').strip():
            logger.info("Equipment extractor: no path configured; skipping extraction.")
            return {}
        
        # Validate configuration before extraction
        if not self._validate_config():
            raise ValueError("Equipment extractor configuration validation failed")
        
        # Extract equipment quotes
        equipment_quotes = self._extract_equipment_quotes()
        if equipment_quotes:
            self.equipment_data['quotes'] = equipment_quotes
        
        # Calculate equipment summary
        summary = self._calculate_equipment_summary()
        self.equipment_data['summary'] = summary
        
        total_items = len(equipment_quotes) if equipment_quotes else 0
        self.log_extraction_summary(total_items, "Equipment PDF files")
        
        return self.equipment_data
    
    def _validate_config(self) -> bool:
        """
        Validate equipment extractor configuration.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        try:
            # Check if path is configured and exists
            path = self.config.get('path', '')
            if not path:
                # Empty path is valid for skipping extraction
                return True
            
            path_obj = Path(path)
            if not path_obj.exists():
                logger.error(f"Equipment extractor: path does not exist: {path}")
                return False
            
            if not path_obj.is_dir():
                logger.error(f"Equipment extractor: path is not a directory: {path}")
                return False
            
            # Check if pattern is configured
            pattern = self.config.get('pattern', '')
            if not pattern:
                logger.warning("Equipment extractor: 'pattern' not configured, using default 'M1566*.pdf'")
            
            logger.info(f"Equipment extractor configuration validated: path={path}, pattern={pattern}")
            return True
            
        except Exception as e:
            logger.error(f"Equipment extractor configuration validation failed: {str(e)}")
            return False
    
    def _extract_equipment_quotes(self) -> Optional[List[Dict[str, Any]]]:
        """Extract equipment data from PDF quote files."""
        equipment_quotes = []
        
        # Find equipment PDF files
        path_str = self.config.get('path', '')
        if path_str and path_str.strip():
            base_path = Path(path_str)
            if base_path.exists():
                # Get pattern from config with fallback to default
                pattern = self.config.get('pattern', 'M1566*.pdf')
                if not isinstance(pattern, str) or not pattern.strip():
                    pattern = 'M1566*.pdf'
                pdf_files = FileUtils.find_files(str(base_path), pattern)
                
                for pdf_file in pdf_files:
                    try:
                        equipment_info = self._extract_pdf_equipment_data(pdf_file)
                        if equipment_info:
                            equipment_quotes.append(equipment_info)
                            logger.info(f"Extracted equipment data from: {Path(pdf_file).name}")
                    except Exception as e:
                        logger.error(f"Error extracting equipment data from {pdf_file}: {str(e)}")
        
        return equipment_quotes if equipment_quotes else None
    
    def _extract_pdf_equipment_data(self, pdf_path: str) -> Optional[Dict[str, Any]]:
        """Extract equipment data from a single PDF file."""
        try:
            # Try to extract text using pdftotext
            text = self._extract_pdf_text(pdf_path)
            if not text:
                logger.warning(f"Could not extract text from {pdf_path}")
                return None
            
            # Parse equipment information from text
            equipment_info = self._parse_equipment_text(text, pdf_path)
            return equipment_info
            
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {str(e)}")
            return None
    
    def _extract_pdf_text(self, pdf_path: str) -> Optional[str]:
        """Extract text from PDF using pdftotext command."""
        try:
            # Validate that pdf_path is a valid file
            pdf_file = Path(pdf_path)
            if not pdf_file.is_file():
                logger.warning(f"Invalid PDF path: {pdf_path}")
                return None

            result = subprocess.run(
                ['pdftotext', str(pdf_file), '-'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return result.stdout
            else:
                logger.warning(f"pdftotext failed for {pdf_path}: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            logger.warning(f"PDF text extraction timeout for {pdf_path}")
            return None
        except FileNotFoundError:
            logger.warning("pdftotext not found. Install poppler-utils for PDF text extraction.")
            return None
        except Exception as e:
            logger.error(f"Error extracting PDF text from {pdf_path}: {str(e)}")
            return None
    
    def _parse_equipment_text(self, text: str, pdf_path: str) -> Dict[str, Any]:
        """Parse equipment information from extracted text with field mapping traceability."""
        filename = Path(pdf_path).name
        
        # Get equipment mappings from config
        equipment_mappings = self.field_mapping_registry.get_all_mappings('equipment_mappings')
        
        # Initialize equipment info
        equipment_info = {
            'file_name': filename,
            'file_path': pdf_path,
            'equipment_name': 'Unknown',
            'description': 'Unknown',
            'price': 0.0,
            'category': 'Unknown',
            'quote_date': 'Unknown',
            'raw_text': text[:500]  # Store first 500 characters for reference
        }
        
        # Use config-based equipment name mapping
        if not equipment_mappings:
            # Log warning when no equipment mappings are configured
            logger.warning(
                f"No equipment mappings configured for file: {pdf_path}. "
                f"Filename: {filename}. Equipment will remain as 'Unknown'."
            )
            # Log to field mapping registry for traceability
            self.field_mapping_registry.log_field_mapping(
                raw_field=filename,
                normalized_field="Unknown",
                source_file=pdf_path,
                transformation="equipment_name_mapping_missing"
            )
        else:
            for pattern, equipment_name in equipment_mappings.items():
                if pattern in filename:
                    equipment_info['equipment_name'] = equipment_name
                    equipment_info['category'] = self._get_equipment_category(equipment_name)
                    equipment_info['description'] = self._get_equipment_description(equipment_name)
                    
                    # Log field mapping for traceability
                    self.field_mapping_registry.log_field_mapping(
                        raw_field=pattern,
                        normalized_field=equipment_name,
                        source_file=pdf_path,
                        transformation="equipment_name_mapping"
                    )
                    break
        
        # Try to extract price from text
        price = self._extract_price_from_text(text)
        if price:
            equipment_info['price'] = price
        
        # Try to extract quote date
        quote_date = self._extract_date_from_text(text)
        if quote_date:
            equipment_info['quote_date'] = quote_date
        
        return equipment_info
    
    def _get_equipment_category(self, equipment_name: str) -> str:
        """Get equipment category based on normalized name."""
        if 'audiometer' in equipment_name.lower():
            return 'Diagnostic Equipment'
        elif 'rem' in equipment_name.lower():
            return 'Measurement Equipment'
        elif 'test' in equipment_name.lower() or 'booth' in equipment_name.lower():
            return 'Test Equipment'
        elif 'system' in equipment_name.lower():
            return 'Complete System'
        else:
            return 'Equipment'
    
    def _get_equipment_description(self, equipment_name: str) -> str:
        """Get equipment description based on normalized name."""
        if 'audiometer' in equipment_name.lower():
            return 'Advanced hearing testing equipment'
        elif 'rem' in equipment_name.lower():
            return 'Real ear measurement system'
        elif 'test' in equipment_name.lower() or 'booth' in equipment_name.lower():
            return 'Professional test booth equipment'
        elif 'system' in equipment_name.lower():
            return 'Complete audiology suite'
        else:
            return 'Professional audiology equipment'
    
    def _extract_price_from_text(self, text: str) -> Optional[float]:
        """Extract price information from text."""
        
        # Look for price patterns
        price_patterns = [
            r'\$[\d,]+\.?\d*',  # $1,234.56
            r'[\d,]+\.?\d*\s*dollars?',  # 1234.56 dollars
            r'Price:\s*\$?[\d,]+\.?\d*',  # Price: $1234.56
            r'Total:\s*\$?[\d,]+\.?\d*',  # Total: $1234.56
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Extract numeric value from first match
                price_str = re.sub(r'[^\d.,]', '', matches[0])
                try:
                    return Decimal(price_str.replace(',', '')).quantize(Decimal('0.01'))
                except (ValueError, InvalidOperation):
                    continue
        
        return None
    
    def _extract_date_from_text(self, text: str) -> Optional[str]:
        """Extract date information from text."""
        
        # Look for date patterns
        date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
            r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
            r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        
        return None
    
    def _calculate_equipment_summary(self) -> Dict[str, Any]:
        """Calculate summary statistics for equipment data."""
        summary = {
            'total_equipment_items': 0,
            'total_estimated_value': 0.0,
            'categories': {},
            'equipment_list': []
        }
        
        if 'quotes' in self.equipment_data:
            quotes = self.equipment_data['quotes']
            summary['total_equipment_items'] = len(quotes)
            
            for quote in quotes:
                # Add to total value (convert Decimal to float if needed)
                price = quote.get('price', 0.0)
                if isinstance(price, Decimal):
                    price = float(price)
                summary['total_estimated_value'] += price
                
                # Count by category
                category = quote.get('category', 'Unknown')
                if category not in summary['categories']:
                    summary['categories'][category] = 0
                summary['categories'][category] += 1
                
                # Add to equipment list
                summary['equipment_list'].append({
                    'name': quote.get('equipment_name', 'Unknown'),
                    'category': category,
                    'price': quote.get('price', 0.0)
                })
        
        return summary
