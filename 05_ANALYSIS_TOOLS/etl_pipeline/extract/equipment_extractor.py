"""
Equipment data extractor for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
import subprocess
import json
from .base_extractor import BaseExtractor
from ..utils.file_utils import FileUtils

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
        
    def extract(self) -> Dict[str, Any]:
        """
        Extract equipment data from PDF files.
        
        Returns:
            Dict containing extracted equipment data
        """
        logger.info("Starting equipment data extraction...")
        
        # Skip base config validation for equipment extractor
        
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
    
    def _extract_equipment_quotes(self) -> Optional[List[Dict[str, Any]]]:
        """Extract equipment data from PDF quote files."""
        equipment_quotes = []
        
        # Find equipment PDF files
        base_path = Path(self.config.get('path', ''))
        if base_path.exists():
            pdf_files = FileUtils.find_files(str(base_path), "M1566*.pdf")
            
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
            result = subprocess.run(
                ['pdftotext', pdf_path, '-'],
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
        """Parse equipment information from extracted text."""
        filename = Path(pdf_path).name
        
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
        
        # Parse equipment name from filename
        if 'Cello' in filename:
            equipment_info['equipment_name'] = 'Cello Audiometer System'
            equipment_info['category'] = 'Diagnostic Equipment'
            equipment_info['description'] = 'Advanced hearing testing equipment'
        elif 'Trumpet' in filename:
            equipment_info['equipment_name'] = 'Trumpet REM System'
            equipment_info['category'] = 'Measurement Equipment'
            equipment_info['description'] = 'Real ear measurement system'
        elif 'CL12BLP' in filename:
            equipment_info['equipment_name'] = 'CL12BLP Equipment'
            equipment_info['category'] = 'Diagnostic Equipment'
            equipment_info['description'] = 'Professional diagnostic tools'
        elif 'AUD' in filename:
            equipment_info['equipment_name'] = 'AUD System'
            equipment_info['category'] = 'Complete System'
            equipment_info['description'] = 'Complete audiology suite'
        
        # Try to extract price from text
        price = self._extract_price_from_text(text)
        if price:
            equipment_info['price'] = price
        
        # Try to extract quote date
        quote_date = self._extract_date_from_text(text)
        if quote_date:
            equipment_info['quote_date'] = quote_date
        
        return equipment_info
    
    def _extract_price_from_text(self, text: str) -> Optional[float]:
        """Extract price information from text."""
        import re
        
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
                    return float(price_str.replace(',', ''))
                except ValueError:
                    continue
        
        return None
    
    def _extract_date_from_text(self, text: str) -> Optional[str]:
        """Extract date information from text."""
        import re
        
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
                # Add to total value
                summary['total_estimated_value'] += quote.get('price', 0.0)
                
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
