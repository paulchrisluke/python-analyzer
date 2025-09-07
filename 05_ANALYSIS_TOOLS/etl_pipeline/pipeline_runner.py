"""
Main ETL pipeline runner for Cranberry Hearing and Balance Center.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
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
from .utils.due_diligence_manager import DueDiligenceManager
from .utils.file_utils import FileUtils
from .utils.data_validation import DataValidator

logger = logging.getLogger(__name__)

class ETLPipeline:
    """Main ETL pipeline orchestrator."""
    
    def __init__(self, config_dir: str = None):
        """
        Initialize ETL pipeline.
        
        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = Path(config_dir) if config_dir else Path(__file__).parent / "config"
        self.data_sources_config = None
        self.business_rules = None
        self.schemas = None
        
        # Pipeline components
        self.extractors = {}
        self.transformers = {}
        self.loaders = {}
        
        # Due diligence manager
        self.due_diligence_manager = None
        
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
            'warnings': []
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
        
        try:
            self.pipeline_metadata['start_time'] = datetime.now()
            self.pipeline_metadata['status'] = 'running'
            
            logger.info("Starting ETL pipeline execution...")
            
            # Phase 1: Extract
            logger.info("Phase 1: Data Extraction")
            if not self._extract_data():
                success = False
                self.pipeline_metadata['errors'].append("Data extraction phase failed")
            else:
                logger.info("Phase 1: Data Extraction - SUCCESS")
            
            # Phase 2: Transform
            logger.info("Phase 2: Data Transformation")
            if not self._transform_data():
                success = False
                self.pipeline_metadata['errors'].append("Data transformation phase failed")
            else:
                logger.info("Phase 2: Data Transformation - SUCCESS")
            
            # Phase 3: Load
            logger.info("Phase 3: Data Loading")
            if not self._load_data():
                success = False
                self.pipeline_metadata['errors'].append("Data loading phase failed")
            else:
                logger.info("Phase 3: Data Loading - SUCCESS")
            
        except Exception as e:
            success = False
            error_msg = f"Pipeline execution failed: {str(e)}"
            logger.error(error_msg)
            self.pipeline_metadata['errors'].append(error_msg)
        
        finally:
            # Always finalize pipeline metadata
            self.pipeline_metadata['end_time'] = datetime.now()
            self.pipeline_metadata['status'] = 'completed' if success else 'failed'
            
            # Compute and log duration
            if self.pipeline_metadata['start_time']:
                duration = self.pipeline_metadata['end_time'] - self.pipeline_metadata['start_time']
                if success:
                    logger.info(f"ETL pipeline completed successfully in {duration}")
                else:
                    logger.error(f"ETL pipeline failed after {duration}")
                    logger.error(f"Errors encountered: {self.pipeline_metadata['errors']}")
            
            return success
    
    def _load_configurations(self) -> None:
        """Load configuration files."""
        logger.info("Loading configuration files...")
        
        # Load data sources configuration
        data_sources_file = self.config_dir / "data_sources.yaml"
        if data_sources_file.exists():
            self.data_sources_config = FileUtils.load_yaml(str(data_sources_file))
            logger.info("Data sources configuration loaded")
        else:
            raise FileNotFoundError(f"Data sources configuration not found: {data_sources_file}")
        
        # Load business rules
        business_rules_file = self.config_dir / "business_rules.yaml"
        if business_rules_file.exists():
            self.business_rules = FileUtils.load_yaml(str(business_rules_file))
            logger.info("Business rules configuration loaded")
        else:
            raise FileNotFoundError(f"Business rules configuration not found: {business_rules_file}")
        
        # Load schemas
        schemas_file = self.config_dir / "schemas.yaml"
        if schemas_file.exists():
            self.schemas = FileUtils.load_yaml(str(schemas_file))
            logger.info("Schemas configuration loaded")
        else:
            raise FileNotFoundError(f"Schemas configuration not found: {schemas_file}")
    
    def _initialize_extractors(self) -> None:
        """Initialize data extractors."""
        logger.info("Initializing data extractors...")
        
        # Initialize sales extractor
        sales_config = self.data_sources_config.get('data_sources', {}).get('sales', {})
        if sales_config:
            self.extractors['sales'] = SalesExtractor(sales_config)
            logger.info("Sales extractor initialized")
        
        # Initialize financial extractor
        financial_config = self.data_sources_config.get('data_sources', {})
        if financial_config:
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
        
        # Initialize equipment extractor
        equipment_config = self.data_sources_config.get('data_sources', {}).get('equipment_quotes', {})
        if equipment_config:
            self.extractors['equipment'] = EquipmentExtractor(equipment_config)
            logger.info("Equipment extractor initialized")
    
    def _initialize_transformers(self) -> None:
        """Initialize data transformers."""
        logger.info("Initializing data transformers...")
        
        # Initialize sales transformer
        self.transformers['sales'] = SalesTransformer(self.business_rules)
        logger.info("Sales transformer initialized")
        
        # Initialize business metrics calculator
        self.transformers['business_metrics'] = BusinessMetricsCalculator(self.business_rules)
        logger.info("Business metrics calculator initialized")
        
        # Initialize data coverage analyzer
        self.coverage_analyzer = DataCoverageAnalyzer(self.business_rules)
        logger.info("Data coverage analyzer initialized")
    
    def _initialize_loaders(self) -> None:
        """Initialize data loaders."""
        logger.info("Initializing data loaders...")
        
        # Initialize JSON loader
        data_output_dir = Path(__file__).parent.parent / "data"
        self.loaders['json'] = JsonLoader(str(data_output_dir))
        logger.info("JSON loader initialized")
        
        # Initialize report generator
        reports_output_dir = Path(__file__).parent.parent / "reports"
        self.loaders['reports'] = ReportGenerator(str(reports_output_dir))
        logger.info("Report generator initialized")
    
    def _extract_data(self) -> bool:
        """
        Extract data from all sources.
        
        Returns:
            bool: True if extraction successful
        """
        try:
            logger.info("Starting data extraction...")
            
            # Extract sales data
            if 'sales' in self.extractors:
                logger.info("Extracting sales data...")
                sales_data = self.extractors['sales'].extract()
                self.raw_data['sales'] = sales_data
                logger.info("Sales data extraction completed")
            
            # Extract financial data
            if 'financial' in self.extractors:
                logger.info("Extracting financial data...")
                financial_data = self.extractors['financial'].extract()
                self.raw_data['financial'] = financial_data
                logger.info("Financial data extraction completed")
            
            # Extract equipment data
            if 'equipment' in self.extractors:
                logger.info("Extracting equipment data...")
                equipment_data = self.extractors['equipment'].extract()
                self.raw_data['equipment'] = equipment_data
                logger.info("Equipment data extraction completed")
            
            logger.info("Data extraction phase completed")
            return True
            
        except Exception as e:
            logger.error(f"Data extraction failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Extraction error: {str(e)}")
            return False
    
    def _transform_data(self) -> bool:
        """
        Transform raw data to normalized format.
        
        Returns:
            bool: True if transformation successful
        """
        try:
            logger.info("Starting data transformation...")
            
            # Transform sales data
            if 'sales' in self.transformers and 'sales' in self.raw_data:
                logger.info("Transforming sales data...")
                sales_transformed = self.transformers['sales'].transform(self.raw_data['sales'])
                self.normalized_data['sales'] = sales_transformed
                logger.info("Sales data transformation completed")
            
            # Calculate business metrics
            if 'business_metrics' in self.transformers:
                logger.info("Calculating business metrics...")
                # Pass both normalized and raw data for comprehensive analysis
                # Fall back to raw data if normalized data is empty
                combined_data = {
                    'sales': self.normalized_data.get('sales', {}),
                    'financial': self.normalized_data.get('financial', self.raw_data.get('financial', {}))
                }
                business_metrics = self.transformers['business_metrics'].calculate_comprehensive_metrics(combined_data)
                self.final_data['business_metrics'] = business_metrics
                logger.info("Business metrics calculation completed")
            
            # Analyze data coverage for due diligence
            logger.info("Analyzing data coverage...")
            coverage_analysis = self.coverage_analyzer.analyze_comprehensive_coverage(self.raw_data)
            self.final_data['coverage_analysis'] = coverage_analysis
            logger.info("Data coverage analysis completed")
            
            logger.info("Data transformation phase completed")
            return True
            
        except Exception as e:
            logger.error(f"Data transformation failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Transformation error: {str(e)}")
            return False
    
    def _load_data(self) -> bool:
        """
        Load transformed data to final destinations.
        
        Returns:
            bool: True if loading successful
        """
        try:
            logger.info("Starting data loading...")
            
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
                json_results = self.loaders['json'].load(load_data)
                logger.info("JSON data loading completed")
            
            # Generate reports
            if 'reports' in self.loaders:
                logger.info("Generating reports...")
                report_results = self.loaders['reports'].load(load_data)
                logger.info("Report generation completed")
            
            # Process due diligence data
            if self.due_diligence_manager:
                logger.info("Processing due diligence data...")
                self._process_due_diligence()
                logger.info("Due diligence processing completed")
            
            logger.info("Data loading phase completed")
            return True
            
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
            'warnings': self.pipeline_metadata['warnings'],
            'data_summary': {
                'raw_data_sources': list(self.raw_data.keys()),
                'normalized_data_types': list(self.normalized_data.keys()),
                'final_data_types': list(self.final_data.keys())
            }
        }
    
    def _initialize_due_diligence_manager(self) -> None:
        """Initialize due diligence manager."""
        try:
            logger.info("Initializing due diligence manager...")
            
            # Set up data and docs directories
            data_dir = Path(__file__).parent.parent / "data"
            docs_dir = Path(__file__).parent.parent.parent / "docs"
            
            self.due_diligence_manager = DueDiligenceManager(
                data_dir=str(data_dir),
                docs_dir=str(docs_dir)
            )
            
            # Load existing data
            self.due_diligence_manager.load_existing_data()
            
            logger.info("Due diligence manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize due diligence manager: {str(e)}")
            self.pipeline_metadata['warnings'].append(f"Due diligence manager initialization failed: {str(e)}")
    
    def _process_due_diligence(self) -> None:
        """Process due diligence data and generate stage exports."""
        try:
            # Validate data
            validation_results = self.due_diligence_manager.validate()
            logger.info(f"Due diligence validation completed: {validation_results['status']}")
            
            # Calculate scores
            scores = self.due_diligence_manager.calculate_scores()
            logger.info(f"Due diligence scores calculated: {scores['overall_score']}% overall")
            
            # Export all stage data
            self.due_diligence_manager.export_all()
            logger.info("Due diligence stage exports completed")
            
        except Exception as e:
            logger.error(f"Due diligence processing failed: {str(e)}")
            self.pipeline_metadata['errors'].append(f"Due diligence processing error: {str(e)}")
    
    def run_due_diligence_only(self) -> bool:
        """
        Run only the due diligence processing (standalone mode).
        
        Returns:
            bool: True if due diligence processing successful
        """
        try:
            logger.info("Running due diligence processing in standalone mode...")
            
            # Initialize due diligence manager
            self._initialize_due_diligence_manager()
            
            if not self.due_diligence_manager:
                logger.error("Due diligence manager not initialized")
                return False
            
            # Process due diligence
            self._process_due_diligence()
            
            logger.info("Due diligence processing completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Standalone due diligence processing failed: {str(e)}")
            return False
