"""
Main ETL pipeline runner for Cranberry Hearing and Balance Center.
"""

import logging
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import pipeline components
from .extract.sales_extractor import SalesExtractor
from .extract.financial_extractor import FinancialExtractor
from .extract.equipment_extractor import EquipmentExtractor
from .transform.sales_transformer import SalesTransformer
from .transform.business_metrics import BusinessMetricsCalculator
from .load.json_loader import JsonLoader
from .load.report_generator import ReportGenerator
from .utils.logging_config import setup_logging
from .utils.data_coverage_analyzer import DataCoverageAnalyzer
from .utils.enhanced_coverage_analyzer import EnhancedCoverageAnalyzer
from .utils.due_diligence_manager import DueDiligenceManager
from .utils.file_utils import FileUtils
from .utils.data_validation import DataValidator

logger = logging.getLogger(__name__)

class ETLPipeline:
    """Main ETL pipeline orchestrator."""
    
    def __init__(self, config_dir: str = None, early_exit_on_critical_failure: bool = True):
        """
        Initialize ETL pipeline.
        
        Args:
            config_dir: Directory containing configuration files
            early_exit_on_critical_failure: Whether to exit early on critical failures (default: True)
        """
        self.config_dir = Path(config_dir) if config_dir else Path(__file__).parent / "config"
        self.early_exit_on_critical_failure = early_exit_on_critical_failure
        self.data_sources_config = None
        self.business_rules = None
        self.schemas = None
        
        # Pipeline components
        self.extractors = {}
        self.transformers = {}
        self.loaders = {}
        
        # Due diligence manager and coverage analyzer
        self.due_diligence_manager = None
        self.coverage_analyzer = None
        
        # Pipeline data
        self.raw_data = {}
        self.normalized_data = {}
        self.final_data = {}
        
        # Pipeline metadata
        self.pipeline_metadata = {
            'start_time': None,
            'end_time': None,
            'status': 'initialized',
            'errors': [],
            'early_exit_enabled': early_exit_on_critical_failure
        }
    
    def initialize(self) -> bool:
        """
        Initialize pipeline with configuration.
        
        Returns:
            bool: True if initialization successful
        """
        try:
            logger.info("Initializing ETL pipeline...")
            
            # Load configuration files
            self._load_configurations()
            
            # Initialize extractors
            self._initialize_extractors()
            
            # Initialize transformers
            self._initialize_transformers()
            
            # Initialize loaders
            self._initialize_loaders()
            
            # Initialize due diligence manager
            self._initialize_due_diligence_manager()
            
            logger.info("ETL pipeline initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Pipeline initialization failed: {str(e)}")
            self.pipeline_metadata['errors'].append(str(e))
            return False
    
    def run(self) -> bool:
        """
        Run the complete ETL pipeline.
        
        Returns:
            bool: True if pipeline completed successfully
        """
        success = True
        critical_failures = []
        
        try:
            self.pipeline_metadata['start_time'] = datetime.now()
            self.pipeline_metadata['status'] = 'running'
            
            logger.info("Starting ETL pipeline execution...")
            if self.early_exit_on_critical_failure:
                logger.info("Early exit on critical failures is ENABLED")
            else:
                logger.warning("Early exit on critical failures is DISABLED - pipeline will continue despite failures")
            
            # Load configuration files first - CRITICAL: Exit if this fails
            logger.info("Loading configuration files...")
            try:
                self._load_configurations()
                logger.info("Configuration files loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load configuration files: {str(e)}"
                logger.exception(error_msg)
                self.pipeline_metadata['errors'].append(error_msg)
                if self.early_exit_on_critical_failure:
                    raise RuntimeError(error_msg) from e
                else:
                    logger.warning("Early exit disabled - will continue with default configurations")
                    # Initialize safe empty defaults to prevent AttributeErrors
                    self.data_sources_config = {}
                    self.business_rules = {}
                    self.schemas = {}
                    # Ensure pipeline_metadata has all required keys
                    self.pipeline_metadata.setdefault('warnings', [])
                    self.pipeline_metadata.setdefault('errors', [])
                    logger.info("Initialized safe empty defaults for configurations")
            
            # Initialize due diligence manager - Continue even if this fails
            logger.info("Initializing due diligence manager...")
            try:
                self._initialize_due_diligence_manager()
                if not self.due_diligence_manager:
                    logger.warning("Due diligence manager initialization failed - will skip due diligence processing")
                else:
                    logger.info("Due diligence manager initialized successfully")
            except Exception as e:
                logger.warning(f"Due diligence manager initialization failed: {str(e)} - will skip due diligence processing")
            
            # Initialize pipeline components - Continue even if some fail
            logger.info("Initializing pipeline components...")
            try:
                self._initialize_extractors()
                self._initialize_transformers()
                self._initialize_loaders()
                logger.info("Pipeline components initialization completed (with graceful handling of missing components)")
            except Exception as e:
                logger.warning(f"Pipeline components initialization failed: {str(e)} - will continue with available components")
            
            # Phase 1: Extract - Continue even if some data is missing
            logger.info("Phase 1: Data Extraction")
            try:
                if not self._extract_data():
                    critical_failures.append("Data extraction phase failed - no data available from any source")
                    self._handle_critical_failure(
                        "Data extraction phase failed - no data available from any source",
                        "extraction"
                    )
                else:
                    logger.info("Phase 1: Data Extraction - SUCCESS (with graceful handling of missing data)")
            except Exception as e:
                logger.warning(f"Data extraction phase failed: {str(e)} - will continue with default data")
                critical_failures.append(f"Data extraction phase failed: {str(e)}")
            
            # Phase 2: Transform - Continue even if some transformations fail
            logger.info("Phase 2: Data Transformation")
            try:
                if not self._transform_data():
                    critical_failures.append("Data transformation phase failed - using default values where possible")
                    self._handle_critical_failure(
                        "Data transformation phase failed - using default values where possible",
                        "transformation"
                    )
                else:
                    logger.info("Phase 2: Data Transformation - SUCCESS (with graceful handling of missing data)")
            except Exception as e:
                logger.warning(f"Data transformation phase failed: {str(e)} - will continue with default values")
                critical_failures.append(f"Data transformation phase failed: {str(e)}")
            
            # Phase 3: Load - Continue even if some loading fails
            logger.info("Phase 3: Data Loading")
            try:
                if not self._load_data():
                    critical_failures.append("Data loading phase failed - some outputs may not be generated")
                    self._handle_critical_failure(
                        "Data loading phase failed - some outputs may not be generated",
                        "loading"
                    )
                else:
                    logger.info("Phase 3: Data Loading - SUCCESS (with graceful handling of missing data)")
            except Exception as e:
                logger.warning(f"Data loading phase failed: {str(e)} - will continue with available outputs")
                critical_failures.append(f"Data loading phase failed: {str(e)}")
            
        except Exception as e:
            success = False
            error_msg = f"Pipeline execution failed: {str(e)}"
            logger.error(error_msg)
            self.pipeline_metadata['errors'].append(error_msg)
            
            # Log early exit information
            if self.pipeline_metadata['start_time']:
                duration = datetime.now() - self.pipeline_metadata['start_time']
                if self.early_exit_on_critical_failure:
                    logger.error(f"Pipeline failed after {duration} - early exit due to critical failure")
                else:
                    logger.warning(f"Pipeline failed after {duration} - but early exit is disabled")
        
        finally:
            # Check for critical failures even when early exit is disabled
            if not self.early_exit_on_critical_failure and critical_failures:
                # Don't set success to False - we want to continue processing
                logger.warning(f"Pipeline completed with {len(critical_failures)} critical failures - but continued processing")
            
            # Always finalize pipeline metadata
            self.pipeline_metadata['end_time'] = datetime.now()
            # Consider pipeline successful if it completed even with missing data
            if not self.early_exit_on_critical_failure and critical_failures:
                self.pipeline_metadata['status'] = 'completed_with_warnings'
                success = True  # Override success to True when we have warnings but completed
            else:
                self.pipeline_metadata['status'] = 'completed' if success else 'failed'
            
            # Compute and log duration
            if self.pipeline_metadata['start_time']:
                duration = self.pipeline_metadata['end_time'] - self.pipeline_metadata['start_time']
                if self.pipeline_metadata['status'] == 'completed':
                    logger.info(f"ETL pipeline completed successfully in {duration}")
                elif self.pipeline_metadata['status'] == 'completed_with_warnings':
                    logger.warning(f"ETL pipeline completed with warnings in {duration}")
                    logger.warning(f"Warnings encountered: {self.pipeline_metadata['errors']}")
                else:
                    logger.error(f"ETL pipeline failed after {duration}")
                    logger.error(f"Errors encountered: {self.pipeline_metadata['errors']}")
            
            # Don't return here - let the method return after finally block
        
        # Return success status after finally block
        return success
    
    def _handle_critical_failure(self, error_msg: str, phase: str = None) -> None:
        """
        Handle a critical failure by either raising an exception or logging a warning.
        
        Args:
            error_msg: Error message describing the failure
            phase: Optional phase name for context
        """
        phase_context = f" in {phase}" if phase else ""
        full_error_msg = f"{error_msg}{phase_context}"
        
        logger.error(full_error_msg)
        self.pipeline_metadata['errors'].append(full_error_msg)
        
        if self.early_exit_on_critical_failure:
            raise RuntimeError(full_error_msg)
        else:
            logger.warning(f"Early exit disabled - continuing despite critical failure{phase_context}")
            # Don't raise exception - just log the warning and continue
    
    def _load_configurations(self) -> None:
        """Load configuration files."""
        logger.info("Loading configuration files...")
        
        # Load data sources configuration
        data_sources_file = self.config_dir / "data_sources.yaml"
        if data_sources_file.exists():
            try:
                self.data_sources_config = FileUtils.load_yaml(str(data_sources_file))
                logger.info("Data sources configuration loaded")
            except (yaml.YAMLError, ValueError) as err:
                logger.error(f"Failed to parse data sources configuration: {data_sources_file} - {err}")
                raise ValueError(f"Failed to parse {data_sources_file}: {err}") from err
        else:
            raise FileNotFoundError(f"Data sources configuration not found: {data_sources_file}")
        
        # Load business rules
        business_rules_file = self.config_dir / "business_rules.yaml"
        if business_rules_file.exists():
            try:
                self.business_rules = FileUtils.load_yaml(str(business_rules_file))
                logger.info("Business rules configuration loaded")
            except (yaml.YAMLError, ValueError) as err:
                logger.error(f"Failed to parse business rules configuration: {business_rules_file} - {err}")
                raise ValueError(f"Failed to parse {business_rules_file}: {err}") from err
        else:
            raise FileNotFoundError(f"Business rules configuration not found: {business_rules_file}")
        
        # Load schemas
        schemas_file = self.config_dir / "schemas.yaml"
        if schemas_file.exists():
            try:
                self.schemas = FileUtils.load_yaml(str(schemas_file))
                logger.info("Schemas configuration loaded")
            except (yaml.YAMLError, ValueError) as err:
                logger.error(f"Failed to parse schemas configuration: {schemas_file} - {err}")
                raise ValueError(f"Failed to parse {schemas_file}: {err}") from err
        else:
            raise FileNotFoundError(f"Schemas configuration not found: {schemas_file}")
    
    def _initialize_extractors(self) -> None:
        """Initialize data extractors with graceful handling of missing configurations."""
        logger.info("Initializing data extractors...")
        
        # Initialize sales extractor
        sales_config = self.data_sources_config.get('data_sources', {}).get('sales_transactions', {})
        if sales_config:
            try:
                # Map 'pattern' to 'sales_pattern' for SalesExtractor compatibility
                if 'pattern' in sales_config and 'sales_pattern' not in sales_config:
                    sales_config['sales_pattern'] = sales_config['pattern']
                    logger.info("Mapped 'pattern' to 'sales_pattern' for sales extractor compatibility")
                elif 'sales_pattern' not in sales_config:
                    # Set a safer default that is case-insensitive
                    sales_config['sales_pattern'] = '*[sS]ales*.csv'
                    logger.info("Set default case-insensitive sales pattern: *[sS]ales*.csv")
                
                self.extractors['sales'] = SalesExtractor(sales_config)
                logger.info("Sales extractor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize sales extractor: {str(e)} - will use default values")
        else:
            logger.info("No sales transaction data source configured - sales metrics will be set to 0")
        
        # Initialize financial extractor
        financial_config = self.data_sources_config.get('data_sources', {})
        if financial_config:
            try:
                # Create a combined config for financial extractor
                combined_financial_config = {
                    'type': 'csv',
                    'financial_pnl_2023': financial_config.get('financial_pnl_2023', {}),
                    'financial_pnl_2024': financial_config.get('financial_pnl_2024', {}),
                    'financial_balance_sheets': financial_config.get('financial_balance_sheets', {}),
                    'financial_general_ledger': financial_config.get('financial_general_ledger', {}),
                    'financial_cogs': financial_config.get('financial_cogs', {})
                }
                self.extractors['financial'] = FinancialExtractor(combined_financial_config)
                logger.info("Financial extractor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize financial extractor: {str(e)} - will use default values")
        else:
            logger.info("No financial data sources configured - financial metrics will be set to 0")
        
        # Initialize equipment extractor
        equipment_config = self.data_sources_config.get('data_sources', {}).get('equipment_quotes', {})
        if equipment_config:
            try:
                self.extractors['equipment'] = EquipmentExtractor(equipment_config)
                logger.info("Equipment extractor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize equipment extractor: {str(e)} - will use default values")
        else:
            logger.info("No equipment data source configured - equipment metrics will be set to 0")
    
    def _initialize_transformers(self) -> None:
        """Initialize data transformers with graceful handling of missing configurations."""
        logger.info("Initializing data transformers...")
        
        # Initialize sales transformer
        try:
            self.transformers['sales'] = SalesTransformer(self.business_rules)
            logger.info("Sales transformer initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize sales transformer: {str(e)} - will use default values")
        
        # Initialize business metrics calculator
        try:
            self.transformers['business_metrics'] = BusinessMetricsCalculator(self.business_rules)
            logger.info("Business metrics calculator initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize business metrics calculator: {str(e)} - will use default values")
        
        # Initialize enhanced coverage analyzer
        try:
            # Ensure due diligence manager is initialized to get document registry
            if self.due_diligence_manager is None:
                self._initialize_due_diligence_manager()
            # Initialize enhanced coverage analyzer with document registry
            self.coverage_analyzer = EnhancedCoverageAnalyzer(
                self.business_rules, 
                self.due_diligence_manager.document_registry
            )
            logger.info("Enhanced coverage analyzer initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize enhanced coverage analyzer: {str(e)} - falling back to basic analyzer")
            try:
                self.coverage_analyzer = DataCoverageAnalyzer(self.business_rules)
                logger.info("Basic data coverage analyzer initialized as fallback")
            except Exception as e2:
                logger.warning(f"Failed to initialize basic coverage analyzer: {str(e2)} - will use default values")
    
    def _initialize_loaders(self) -> None:
        """Initialize data loaders with graceful handling of missing directories."""
        logger.info("Initializing data loaders...")
        
        # Initialize JSON loader
        try:
            data_output_dir = Path(__file__).parent.parent / "data"
            if not data_output_dir.exists():
                logger.info(f"Data output directory does not exist: {data_output_dir} - will create it")
                data_output_dir.mkdir(parents=True, exist_ok=True)
            self.loaders['json'] = JsonLoader(str(data_output_dir))
            logger.info("JSON loader initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize JSON loader: {str(e)} - will skip JSON output")
        
        # Initialize report generator
        try:
            reports_output_dir = Path(__file__).parent.parent / "reports"
            if not reports_output_dir.exists():
                logger.info(f"Reports output directory does not exist: {reports_output_dir} - will create it")
                reports_output_dir.mkdir(parents=True, exist_ok=True)
            self.loaders['reports'] = ReportGenerator(str(reports_output_dir))
            logger.info("Report generator initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize report generator: {str(e)} - will skip report generation")
    
    def _extract_data(self) -> bool:
        """
        Extract data from all sources with graceful handling of missing data.
        
        Returns:
            bool: True if extraction successful (even with missing data)
        """
        try:
            logger.info("Starting data extraction...")
            extraction_success = True
            missing_data_sources = []
            
            # Extract sales data
            if 'sales' in self.extractors:
                logger.info("Extracting sales data...")
                try:
                    sales_data = self.extractors['sales'].extract()
                    if sales_data and len(sales_data) > 0:
                        self.raw_data['sales'] = sales_data
                        logger.info("Sales data extraction completed")
                    else:
                        logger.warning("No sales data extracted - will use default values")
                        missing_data_sources.append('sales')
                except Exception as e:
                    logger.warning(f"Sales data extraction failed: {str(e)} - will use default values")
                    missing_data_sources.append('sales')
            else:
                logger.info("No sales extractor configured - will use default values")
                missing_data_sources.append('sales')
            
            # Extract financial data
            if 'financial' in self.extractors:
                logger.info("Extracting financial data...")
                try:
                    financial_data = self.extractors['financial'].extract()
                    if financial_data and len(financial_data) > 0:
                        self.raw_data['financial'] = financial_data
                        logger.info("Financial data extraction completed")
                    else:
                        logger.warning("No financial data extracted - will use default values")
                        missing_data_sources.append('financial')
                except Exception as e:
                    logger.warning(f"Financial data extraction failed: {str(e)} - will use default values")
                    missing_data_sources.append('financial')
            else:
                logger.info("No financial extractor configured - will use default values")
                missing_data_sources.append('financial')
            
            # Extract equipment data
            if 'equipment' in self.extractors:
                logger.info("Extracting equipment data...")
                try:
                    equipment_data = self.extractors['equipment'].extract()
                    if equipment_data and len(equipment_data) > 0:
                        self.raw_data['equipment'] = equipment_data
                        logger.info("Equipment data extraction completed")
                    else:
                        logger.warning("No equipment data extracted - will use default values")
                        missing_data_sources.append('equipment')
                except Exception as e:
                    logger.warning(f"Equipment data extraction failed: {str(e)} - will use default values")
                    missing_data_sources.append('equipment')
            else:
                logger.info("No equipment extractor configured - will use default values")
                missing_data_sources.append('equipment')
            
            # Add default data for missing sources
            if missing_data_sources:
                logger.info(f"Adding default data for missing sources: {missing_data_sources}")
                self._add_default_data(missing_data_sources)
            
            # Check if we have any data at all
            if not self.raw_data:
                logger.error("No data extracted from any source")
                self.pipeline_metadata['errors'].append("No data extracted from any source")
                return False
            
            logger.info("Data extraction phase completed")
            return True
            
        except Exception as e:
            logger.error(f"Data extraction failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Extraction error: {str(e)}")
            return False
    
    def _add_default_data(self, missing_sources: List[str]) -> None:
        """
        Add default data for missing data sources.
        
        Args:
            missing_sources: List of missing data source names
        """
        logger.info(f"Adding default data for missing sources: {missing_sources}")
        
        for source in missing_sources:
            if source == 'sales':
                self.raw_data['sales'] = {
                    'main_sales': None,
                    'summary': {
                        'total_records': 0,
                        'total_revenue': 0,
                        'average_transaction': 0,
                        'unique_locations': 0,
                        'unique_staff': 0,
                        'date_range': {'start': 'Unknown', 'end': 'Unknown'}
                    },
                    'metadata': {
                        'status': 'no_data_available',
                        'message': 'Sales data not available - using default values'
                    }
                }
                logger.info("Added default sales data")
                
            elif source == 'financial':
                self.raw_data['financial'] = {
                    'profit_loss': {},
                    'balance_sheets': {},
                    'general_ledger': {},
                    'cogs': {},
                    'summary': {
                        'total_revenue': 0,
                        'total_expenses': 0,
                        'net_income': 0,
                        'total_assets': 0,
                        'total_liabilities': 0
                    },
                    'metadata': {
                        'status': 'no_data_available',
                        'message': 'Financial data not available - using default values'
                    }
                }
                logger.info("Added default financial data")
                
            elif source == 'equipment':
                self.raw_data['equipment'] = {
                    'equipment_items': [],
                    'summary': {
                        'total_items': 0,
                        'total_value': 0,
                        'categories': []
                    },
                    'metadata': {
                        'status': 'no_data_available',
                        'message': 'Equipment data not available - using default values'
                    }
                }
                logger.info("Added default equipment data")
    
    def _get_default_sales_data(self) -> Dict[str, Any]:
        """Get default sales data structure."""
        return {
            'sales_transactions': [],
            'summary': {
                'total_revenue': 0,
                'total_transactions': 0,
                'average_transaction': 0,
                'date_range': {'start': 'Unknown', 'end': 'Unknown'}
            },
            'metadata': {
                'status': 'no_data_available',
                'message': 'Sales data not available - using default values'
            }
        }
    
    def _get_default_business_metrics(self) -> Dict[str, Any]:
        """Get default business metrics structure."""
        return {
            'financial': {
                'revenue_metrics': {
                    'total_revenue': {'value': 0, 'currency': 'USD'},
                    'annual_revenue_projection': {'value': 0, 'currency': 'USD'},
                    'monthly_revenue_average': {'value': 0, 'currency': 'USD'}
                },
                'profitability': {
                    'estimated_ebitda': {'value': 0, 'currency': 'USD'},
                    'estimated_annual_ebitda': {'value': 0, 'currency': 'USD'}
                },
                'investment_metrics': {
                    'asking_price': {'value': 0, 'currency': 'USD'},
                    'estimated_market_value': {'value': 0, 'currency': 'USD'},
                    'discount_amount': {'value': 0, 'currency': 'USD'}
                }
            },
            'equipment': {
                'total_value': {'value': 0, 'currency': 'USD'},
                'item_count': 0,
                'categories': []
            },
            'landing_page': {
                'monthly_cash_flow': {'value': 0, 'currency': 'USD'},
                'roi_percentage': 0,
                'payback_period_years': 0,
                'ebitda_margin': 0
            },
            'metadata': {
                'status': 'no_data_available',
                'message': 'Business metrics not available - using default values'
            }
        }
    
    def _get_default_coverage_analysis(self) -> Dict[str, Any]:
        """Get default coverage analysis structure."""
        return {
            'sales': {
                'status': 'no_data',
                'completeness_score': 0.0,
                'missing_periods': [],
                'data_quality_issues': ['No sales data found'],
                'coverage_details': {
                    'total_records': 0,
                    'date_range': {'start': 'Unknown', 'end': 'Unknown'},
                    'categories_found': [],
                    'categories_missing': ['sales_transactions']
                },
                'fallback_strategies': []
            },
            'financial': {
                'status': 'no_data',
                'completeness_score': 0.0,
                'missing_documents': ['profit_loss', 'balance_sheets', 'general_ledger', 'cogs'],
                'data_quality_issues': ['No financial data found'],
                'coverage_details': {
                    'total_documents': 0,
                    'found_documents': [],
                    'missing_documents': ['profit_loss', 'balance_sheets', 'general_ledger', 'cogs']
                },
                'fallback_strategies': []
            },
            'equipment': {
                'status': 'no_data',
                'completeness_score': 0.0,
                'missing_documents': ['equipment_items'],
                'data_quality_issues': ['No equipment data found'],
                'coverage_details': {
                    'equipment_count': 0,
                    'total_value': 0.0,
                    'categories_found': [],
                    'categories_missing': ['equipment_items']
                },
                'fallback_strategies': []
            },
            'due_diligence': {
                'overall_score': 0.0,
                'readiness_level': 'poor',
                'recommendation': 'Not ready for due diligence',
                'category_scores': {
                    'sales': 0.0,
                    'financial': 0.0,
                    'equipment': 0.0
                }
            },
            'recommendations': [
                'No data available - please ensure data sources are properly configured',
                'Check file paths and permissions for data extraction',
                'Verify data source configurations in data_sources.yaml'
            ],
            'etl_run_timestamp': datetime.now().isoformat()
        }
    
    def _transform_data(self) -> bool:
        """
        Transform raw data to normalized format with graceful handling of missing data.
        
        Returns:
            bool: True if transformation successful (even with missing data)
        """
        try:
            logger.info("Starting data transformation...")
            transformation_success = True
            
            # Transform sales data
            if 'sales' in self.transformers and 'sales' in self.raw_data:
                logger.info("Transforming sales data...")
                try:
                    sales_transformed = self.transformers['sales'].transform(self.raw_data['sales'])
                    self.normalized_data['sales'] = sales_transformed
                    logger.info("Sales data transformation completed")
                except Exception as e:
                    logger.warning(f"Sales data transformation failed: {str(e)} - will use default values")
                    self.normalized_data['sales'] = self._get_default_sales_data()
            else:
                logger.info("No sales data to transform - using default values")
                self.normalized_data['sales'] = self._get_default_sales_data()
            
            # Calculate business metrics
            if 'business_metrics' in self.transformers:
                logger.info("Calculating business metrics...")
                try:
                    # Pass both normalized and raw data for comprehensive analysis
                    financial_data = self.raw_data.get('financial', {})
                    combined_data = {
                        'sales': self.normalized_data.get('sales', {}),
                        'profit_loss': financial_data.get('profit_loss', {}),
                        'balance_sheets': financial_data.get('balance_sheets', {}),
                        'general_ledger': financial_data.get('general_ledger', {}),
                        'cogs': financial_data.get('cogs', {}),
                        'summary': financial_data.get('summary', {})
                    }
                    
                    # Debug: Log the data structure being passed
                    logger.info(f"Combined data keys: {list(combined_data.keys())}")
                    logger.info(f"P&L data count: {len(combined_data.get('profit_loss', {}))}")
                    
                    business_metrics = self.transformers['business_metrics'].calculate_comprehensive_metrics(combined_data)
                    
                    # Add calculation lineage to business metrics
                    calculation_lineage = self.transformers['business_metrics'].get_calculation_lineage()
                    business_metrics['calculation_lineage'] = calculation_lineage
                    
                    self.final_data['business_metrics'] = business_metrics
                    logger.info("Business metrics calculation completed")
                except Exception as e:
                    logger.warning(f"Business metrics calculation failed: {str(e)} - will use default values")
                    self.final_data['business_metrics'] = self._get_default_business_metrics()
            else:
                logger.info("No business metrics calculator available - using default values")
                self.final_data['business_metrics'] = self._get_default_business_metrics()
            
            # Analyze data coverage for due diligence
            logger.info("Analyzing data coverage...")
            try:
                # Check if coverage analyzer exists and is not None
                if self.coverage_analyzer is not None:
                    # Use enhanced coverage analysis if available, otherwise fall back to basic
                    if hasattr(self.coverage_analyzer, 'analyze_enhanced_coverage'):
                        coverage_analysis = self.coverage_analyzer.analyze_enhanced_coverage(self.raw_data)
                    else:
                        coverage_analysis = self.coverage_analyzer.analyze_comprehensive_coverage(self.raw_data)
                    self.final_data['coverage_analysis'] = coverage_analysis
                    logger.info("Data coverage analysis completed")
                else:
                    logger.info("No coverage analyzer available - using default coverage analysis")
                    self.final_data['coverage_analysis'] = self._get_default_coverage_analysis()
            except Exception as e:
                logger.warning(f"Data coverage analysis failed: {str(e)} - will use default values")
                self.final_data['coverage_analysis'] = self._get_default_coverage_analysis()
            
            logger.info("Data transformation phase completed")
            return True
            
        except Exception as e:
            logger.error(f"Data transformation failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Transformation error: {str(e)}")
            return False
    
    def _load_data(self) -> bool:
        """
        Load transformed data to final destinations with graceful handling of missing data.
        
        Returns:
            bool: True if loading successful (even with missing data)
        """
        try:
            logger.info("Starting data loading...")
            loading_success = True
            
            # Prepare data for loading
            load_data = {
                'raw_data': self.raw_data,
                'normalized_data': self.normalized_data,
                'business_metrics': self.final_data.get('business_metrics', {}),
                'coverage_analysis': self.final_data.get('coverage_analysis', {})
            }
            
            # Load to JSON files
            if 'json' in self.loaders:
                logger.info("Loading data to JSON files...")
                try:
                    self.loaders['json'].load(load_data)
                    logger.info("JSON data loading completed")
                except Exception as e:
                    logger.warning(f"JSON data loading failed: {str(e)} - will continue with other outputs")
                    loading_success = False
                
                # Load patient dimension data separately with access controls
                if 'patient_dimension' in self.normalized_data:
                    logger.info("Loading patient dimension data with access controls...")
                    try:
                        patient_output_path = Path(__file__).parent.parent / "data" / "restricted" / "patient_dimension.json"
                        patient_success = self.loaders['json'].load_patient_dimension_data(
                            self.normalized_data['patient_dimension'], 
                            str(patient_output_path)
                        )
                        if patient_success:
                            logger.info("Patient dimension data loaded successfully")
                        else:
                            logger.warning("Failed to load patient dimension data")
                    except Exception as e:
                        logger.warning(f"Patient dimension data loading failed: {str(e)}")
            else:
                logger.info("No JSON loader available - skipping JSON output")
            
            # Generate reports
            if 'reports' in self.loaders:
                logger.info("Generating reports...")
                try:
                    self.loaders['reports'].load(load_data)
                    logger.info("Report generation completed")
                except Exception as e:
                    logger.warning(f"Report generation failed: {str(e)} - will continue")
                    loading_success = False
            else:
                logger.info("No report generator available - skipping report generation")
            
            # Process due diligence data
            if self.due_diligence_manager:
                logger.info("Processing due diligence data...")
                try:
                    self._process_due_diligence()
                    logger.info("Due diligence processing completed")
                except Exception as e:
                    logger.warning(f"Due diligence processing failed: {str(e)} - will continue")
                    loading_success = False
            else:
                logger.info("No due diligence manager available - skipping due diligence processing")
            
            logger.info("Data loading phase completed")
            return loading_success  # Return actual loading success status
            
        except Exception as e:
            logger.error(f"Data loading failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Loading error: {str(e)}")
            return False
    
    def get_pipeline_summary(self) -> Dict[str, Any]:
        """
        Get pipeline execution summary.
        
        Returns:
            Dict containing pipeline summary
        """
        return {
            'status': self.pipeline_metadata['status'],
            'start_time': self.pipeline_metadata['start_time'].isoformat() if self.pipeline_metadata['start_time'] else None,
            'end_time': self.pipeline_metadata['end_time'].isoformat() if self.pipeline_metadata['end_time'] else None,
            'duration': str(self.pipeline_metadata['end_time'] - self.pipeline_metadata['start_time']) if self.pipeline_metadata['start_time'] and self.pipeline_metadata['end_time'] else None,
            'errors': self.pipeline_metadata['errors'],
            'data_summary': {
                'raw_data_sources': list(self.raw_data.keys()),
                'normalized_data_types': list(self.normalized_data.keys()),
                'final_data_types': list(self.final_data.keys())
            }
        }
    
    def _initialize_due_diligence_manager(self) -> None:
        """Initialize due diligence manager with graceful handling of missing data."""
        try:
            logger.info("Initializing due diligence manager...")
            
            # Set up data and docs directories
            data_dir = Path(__file__).parent.parent / "data"
            docs_dir = Path(__file__).parent.parent / "docs"
            
            # Check if directories exist
            if not data_dir.exists():
                logger.warning(f"Data directory does not exist: {data_dir} - will create default structure")
                data_dir.mkdir(parents=True, exist_ok=True)
            
            if not docs_dir.exists():
                logger.warning(f"Docs directory does not exist: {docs_dir} - will create default structure")
                docs_dir.mkdir(parents=True, exist_ok=True)
            
            self.due_diligence_manager = DueDiligenceManager(
                data_dir=str(data_dir),
                docs_dir=str(docs_dir),
                config_dir=str(self.config_dir)
            )
            
            # Load existing data
            try:
                self.due_diligence_manager.load_existing_data()
                logger.info("Due diligence manager initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to load existing due diligence data: {str(e)} - will use default values")
                # Don't fail here - the manager is still usable with default values
                
        except Exception as e:
            error_msg = f"Failed to initialize due diligence manager: {str(e)}"
            logger.warning(error_msg)
            # Don't raise here - let the calling method handle the None check
            self.due_diligence_manager = None
    
    def _process_due_diligence(self) -> None:
        """Process due diligence data and generate stage exports with graceful handling of missing data."""
        try:
            # Check if due diligence manager is initialized
            if self.due_diligence_manager is None:
                logger.warning("Due diligence manager is not initialized - skipping due diligence processing")
                return
            
            # Validate data
            try:
                validation_results = self.due_diligence_manager.validate()
                logger.info(f"Due diligence validation completed: {validation_results['status']}")
            except Exception as e:
                logger.warning(f"Due diligence validation failed: {str(e)} - will continue with default values")
                validation_results = {'status': 'failed', 'message': 'Validation failed due to missing data'}
            
            # Calculate scores
            try:
                scores = self.due_diligence_manager.calculate_scores()
                logger.info(f"Due diligence scores calculated: {scores['overall_score']}% overall")
            except Exception as e:
                logger.warning(f"Due diligence score calculation failed: {str(e)} - will use default scores")
                scores = {'overall_score': 0, 'message': 'Score calculation failed due to missing data'}
            
            # Export all stage data
            try:
                self.due_diligence_manager.export_all()
                logger.info("Due diligence stage exports completed")
            except Exception as e:
                logger.warning(f"Due diligence export failed: {str(e)} - will continue")
            
        except Exception as e:
            logger.warning(f"Due diligence processing failed: {str(e)} - will continue with other outputs")
            self.pipeline_metadata['errors'].append(f"Due diligence processing error: {str(e)}")
    
    def run_due_diligence_only(self) -> bool:
        """
        Run only the due diligence processing (standalone mode).
        
        Returns:
            bool: True if due diligence processing successful
        """
        # Set pipeline metadata for due diligence run
        self.pipeline_metadata['status'] = 'running'
        self.pipeline_metadata['start_time'] = datetime.now()
        
        try:
            logger.info(f"Running due diligence processing in standalone mode...")
            
            # Initialize due diligence manager
            self._initialize_due_diligence_manager()
            
            if not self.due_diligence_manager:
                logger.error("Due diligence manager not initialized")
                self.pipeline_metadata['status'] = 'failed'
                self.pipeline_metadata['end_time'] = datetime.now()
                return False
            
            # Process due diligence
            self._process_due_diligence()
            
            # Set success metadata
            self.pipeline_metadata['status'] = 'success'
            self.pipeline_metadata['end_time'] = datetime.now()
            
            # Create concise summary
            duration = self.pipeline_metadata['end_time'] - self.pipeline_metadata['start_time']
            summary = {
                'status': self.pipeline_metadata['status'],
                'start_time': self.pipeline_metadata['start_time'].isoformat(),
                'end_time': self.pipeline_metadata['end_time'].isoformat(),
                'duration_seconds': duration.total_seconds(),
                'result_counts': {
                    'errors': len(self.pipeline_metadata['errors'])
                }
            }
            self.pipeline_metadata['summary'] = summary
            
            logger.info(f"Due diligence processing completed successfully (duration: {duration})")
            return True
            
        except Exception as e:
            # Set failure metadata
            self.pipeline_metadata['status'] = 'failed'
            self.pipeline_metadata['end_time'] = datetime.now()
            
            # Log full exception info for diagnostics
            logger.exception(f"Standalone due diligence processing failed: {str(e)}")
            return False
