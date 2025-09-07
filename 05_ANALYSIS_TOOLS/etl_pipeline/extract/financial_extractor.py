"""
Financial data extractor for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from .base_extractor import BaseExtractor
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

class FinancialExtractor(BaseExtractor):
    """Extractor for financial data from QuickBooks CSV files."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize financial extractor.
        
        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self.financial_data = {}
        
    def extract(self) -> Dict[str, Any]:
        """
        Extract financial data from QuickBooks CSV files.
        
        Returns:
            Dict containing extracted financial data
        """
        logger.info("Starting financial data extraction...")
        
        # Skip base config validation for financial extractor as it has multiple sources
        
        # Extract P&L data
        pnl_data = self._extract_pnl_data()
        if pnl_data:
            self.financial_data['profit_loss'] = pnl_data
        
        # Extract balance sheet data
        balance_sheet_data = self._extract_balance_sheet_data()
        if balance_sheet_data:
            self.financial_data['balance_sheets'] = balance_sheet_data
        
        # Extract general ledger data
        general_ledger_data = self._extract_general_ledger_data()
        if general_ledger_data:
            self.financial_data['general_ledger'] = general_ledger_data
        
        # Extract COGS data
        cogs_data = self._extract_cogs_data()
        if cogs_data:
            self.financial_data['cogs'] = cogs_data
        
        # Calculate summary statistics
        summary = self._calculate_financial_summary()
        self.financial_data['summary'] = summary
        
        # Use the already computed total_records from summary
        total_records = summary.get('total_records', 0)
        self.log_extraction_summary(total_records, "Financial CSV files")
        
        return self.financial_data
    
    def _extract_pnl_data(self) -> Optional[Dict[str, pd.DataFrame]]:
        """Extract Profit & Loss data."""
        pnl_data = {}
        
        # 2023 P&L data
        pnl_2023_path = Path(self.config.get('financial_pnl_2023', {}).get('path', ''))
        if pnl_2023_path.exists():
            pnl_2023_files = FileUtils.find_files(str(pnl_2023_path), "*.[cC][sS][vV]")
            for file_path in pnl_2023_files:
                try:
                    # Try different encodings for QuickBooks CSV files
                    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
                        try:
                            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                            filename = Path(file_path).stem
                            pnl_data[f'pnl_2023_{filename}'] = df
                            logger.info(f"Loaded P&L 2023 data: {filename} ({len(df)} records) with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                    else:
                        logger.error(f"Could not decode P&L 2023 file {file_path} with any encoding")
                except Exception as e:
                    logger.exception("Error loading P&L 2023 file %s", file_path)
        
        # 2024 P&L data
        pnl_2024_path = Path(self.config.get('financial_pnl_2024', {}).get('path', ''))
        if pnl_2024_path.exists():
            pnl_2024_files = FileUtils.find_files(str(pnl_2024_path), "*.[cC][sS][vV]")
            for file_path in pnl_2024_files:
                try:
                    # Try different encodings for QuickBooks CSV files
                    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
                        try:
                            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                            filename = Path(file_path).stem
                            pnl_data[f'pnl_2024_{filename}'] = df
                            logger.info(f"Loaded P&L 2024 data: {filename} ({len(df)} records) with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                    else:
                        logger.error(f"Could not decode P&L 2024 file {file_path} with any encoding")
                except Exception as e:
                    logger.exception("Error loading P&L 2024 file %s", file_path)
        
        return pnl_data if pnl_data else None
    
    def _extract_balance_sheet_data(self) -> Optional[Dict[str, pd.DataFrame]]:
        """Extract balance sheet data."""
        balance_sheet_data = {}
        
        balance_sheet_path = Path(self.config.get('financial_balance_sheets', {}).get('path', ''))
        if balance_sheet_path.exists():
            balance_sheet_files = FileUtils.find_files(str(balance_sheet_path), "*.[cC][sS][vV]")
            for file_path in balance_sheet_files:
                try:
                    # Try different encodings for QuickBooks CSV files
                    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
                        try:
                            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                            filename = Path(file_path).stem
                            balance_sheet_data[f'balance_sheet_{filename}'] = df
                            logger.info(f"Loaded balance sheet data: {filename} ({len(df)} records) with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                    else:
                        logger.error(f"Could not decode balance sheet file {file_path} with any encoding")
                except Exception as e:
                    logger.exception("Error loading balance sheet file %s", file_path)
        
        return balance_sheet_data if balance_sheet_data else None
    
    def _extract_general_ledger_data(self) -> Optional[Dict[str, pd.DataFrame]]:
        """Extract general ledger data."""
        general_ledger_data = {}
        
        general_ledger_path = Path(self.config.get('financial_general_ledger', {}).get('path', ''))
        if general_ledger_path.exists():
            general_ledger_files = FileUtils.find_files(str(general_ledger_path), "*.[cC][sS][vV]")
            for file_path in general_ledger_files:
                try:
                    # Try different encodings for QuickBooks CSV files
                    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
                        try:
                            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                            filename = Path(file_path).stem
                            general_ledger_data[f'general_ledger_{filename}'] = df
                            logger.info(f"Loaded general ledger data: {filename} ({len(df)} records) with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                    else:
                        logger.error(f"Could not decode general ledger file {file_path} with any encoding")
                except Exception as e:
                    logger.exception("Error loading general ledger file %s", file_path)
        
        return general_ledger_data if general_ledger_data else None
    
    def _extract_cogs_data(self) -> Optional[Dict[str, pd.DataFrame]]:
        """Extract Cost of Goods Sold data."""
        cogs_data = {}
        
        cogs_path = Path(self.config.get('financial_cogs', {}).get('path', ''))
        if cogs_path.exists():
            cogs_files = FileUtils.find_files(str(cogs_path), "*.[cC][sS][vV]")
            for file_path in cogs_files:
                try:
                    df = pd.read_csv(file_path, encoding='utf-8', low_memory=False)
                    filename = Path(file_path).stem
                    cogs_data[f'cogs_{filename}'] = df
                    logger.info(f"Loaded COGS data: {filename} ({len(df)} records)")
                except Exception as e:
                    logger.exception("Error loading COGS file %s", file_path)
        
        return cogs_data if cogs_data else None
    
    def _calculate_financial_summary(self) -> Dict[str, Any]:
        """Calculate summary statistics for financial data."""
        summary = {
            'total_files_loaded': 0,
            'data_types': [],
            'years_covered': set(),
            'total_records': 0
        }
        
        for data_type, data in self.financial_data.items():
            if isinstance(data, dict):
                for filename, df in data.items():
                    summary['total_files_loaded'] += 1
                    summary['total_records'] += len(df)
                    
                    # Extract year from filename if possible
                    if '2023' in filename:
                        summary['years_covered'].add(2023)
                    elif '2024' in filename:
                        summary['years_covered'].add(2024)
                    elif '2025' in filename:
                        summary['years_covered'].add(2025)
            elif isinstance(data, pd.DataFrame):
                summary['total_files_loaded'] += 1
                summary['total_records'] += len(data)
        
        summary['data_types'] = list(self.financial_data.keys())
        summary['years_covered'] = sorted(list(summary['years_covered']))
        
        return summary
