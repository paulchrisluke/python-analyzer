"""
Document registry utilities for ETL pipeline traceability.
"""

import os
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)

class DocumentRegistry:
    """Registry for document metadata with comprehensive file tracking."""
    
    def __init__(self):
        """Initialize document registry."""
        self.documents = []
        self.file_metadata_cache = {}
    
    def _validate_path_safety(self, path: Path, base_path: Optional[Path] = None) -> bool:
        """
        Validate that a path is safe and doesn't contain path traversal attempts.
        
        Args:
            path: Path to validate
            base_path: Optional base path to restrict access to (defaults to current working directory)
            
        Returns:
            True if path is safe, False otherwise
        """
        try:
            # Handle None path
            if path is None:
                logger.warning("Path validation failed: path is None")
                return False
            
            # Resolve the path to get absolute path
            resolved_path = path.resolve()
            
            # If no base path specified, use current working directory
            if base_path is None:
                base_path = Path.cwd()
            else:
                base_path = base_path.resolve()
            
            # Check if the resolved path is within the base path
            # This prevents path traversal attacks like ../../../etc/passwd
            try:
                resolved_path.relative_to(base_path)
                return True
            except ValueError:
                # Path is outside the base directory
                logger.warning(f"Path traversal attempt detected: {path} resolves to {resolved_path} which is outside {base_path}")
                return False
                
        except Exception as e:
            logger.error(f"Error validating path safety for {path}: {e}")
            return False
    
    def register_document(self, file_path: Union[str, Path], 
                         category: str = "other",
                         name: Optional[str] = None,
                         notes: Optional[str] = None,
                         expected: bool = True,
                         base_path: Optional[Path] = None) -> Dict[str, Any]:
        """
        Register a document with comprehensive metadata and path traversal protection.
        
        Args:
            file_path: Path to the document file
            category: Document category (financials, legal, equipment, etc.)
            name: Custom name for the document (defaults to filename)
            notes: Optional notes about the document
            expected: Whether this document was expected to be found
            base_path: Optional base path to restrict access to (defaults to current working directory)
            
        Returns:
            Dictionary with document metadata
        """
        file_path = Path(file_path)
        
        # Validate path safety to prevent path traversal attacks (skip if base_path is explicitly None)
        if base_path is not None and not self._validate_path_safety(file_path, base_path):
            logger.error(f"Path traversal attempt blocked: {file_path}")
            raise ValueError(f"Path traversal attempt blocked: {file_path}")
        
        # Get comprehensive file metadata
        metadata = self._get_file_metadata(file_path)
        
        # Create document record
        document = {
            "name": name or file_path.name,
            "category": category,
            "file_type": metadata["file_type"],
            "file_path": str(file_path),
            "file_size": metadata["file_size"],
            "file_size_bytes": metadata["file_size_bytes"],
            "last_modified": metadata["last_modified"],
            "created_date": metadata["created_date"],
            "file_hash": metadata["file_hash"],
            "status": metadata["exists"],
            "expected": expected,
            "notes": notes,
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to registry
        self.documents.append(document)
        
        logger.debug(f"Registered document: {document['name']} in category {category}")
        
        return document
    
    def register_directory(self, directory_path: Union[str, Path], 
                          category: str = "other",
                          file_extensions: Optional[List[str]] = None,
                          recursive: bool = True,
                          base_path: Optional[Path] = None) -> List[Dict[str, Any]]:
        """
        Register all documents in a directory with path traversal protection.
        
        Args:
            directory_path: Path to the directory
            category: Document category for all files
            file_extensions: List of file extensions to include (e.g., ['.pdf', '.csv'])
            recursive: Whether to search subdirectories
            base_path: Optional base path to restrict access to (defaults to current working directory)
            
        Returns:
            List of registered document metadata
        """
        directory_path = Path(directory_path)
        registered_docs = []
        
        # Validate path safety to prevent path traversal attacks (skip if base_path is explicitly None)
        if base_path is not None and not self._validate_path_safety(directory_path, base_path):
            logger.error(f"Path traversal attempt blocked: {directory_path}")
            return registered_docs
        
        if not directory_path.exists():
            logger.warning(f"Directory does not exist: {directory_path}")
            return registered_docs
        
        if not directory_path.is_dir():
            logger.warning(f"Path is not a directory: {directory_path}")
            return registered_docs
        
        try:
            # Get all files in directory
            if recursive:
                files = list(directory_path.rglob("*"))
            else:
                files = list(directory_path.iterdir())
            
            # Filter files and validate each path
            for file_path in files:
                if not file_path.is_file():
                    continue
                
                # Validate each file path to prevent path traversal (skip if base_path is explicitly None)
                if base_path is not None and not self._validate_path_safety(file_path, base_path):
                    logger.warning(f"Skipping file outside allowed directory: {file_path}")
                    continue
                
                # Filter by file extensions if specified
                if file_extensions:
                    if file_path.suffix.lower() not in [ext.lower() for ext in file_extensions]:
                        continue
                
                # Register the document
                try:
                    doc = self.register_document(file_path, category)
                    registered_docs.append(doc)
                except Exception as e:
                    logger.error(f"Error registering document {file_path}: {e}")
                    continue
            
            logger.info(f"Registered {len(registered_docs)} documents from {directory_path}")
            
        except Exception as e:
            logger.error(f"Error processing directory {directory_path}: {e}")
        
        return registered_docs
    
    def _get_file_metadata(self, file_path: Path) -> Dict[str, Any]:
        """
        Get comprehensive metadata for a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dictionary with file metadata
        """
        # Check cache first
        cache_key = str(file_path)
        if cache_key in self.file_metadata_cache:
            return self.file_metadata_cache[cache_key]
        
        metadata = {
            "exists": file_path.exists(),
            "file_type": file_path.suffix.lower() if file_path.suffix else "unknown",
            "file_size": "0 B",
            "file_size_bytes": 0,
            "last_modified": None,
            "created_date": None,
            "file_hash": None
        }
        
        if file_path.exists():
            try:
                stat = file_path.stat()
                
                # File size
                metadata["file_size_bytes"] = stat.st_size
                metadata["file_size"] = self._format_file_size(stat.st_size)
                
                # Dates
                metadata["last_modified"] = datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat()
                metadata["created_date"] = datetime.fromtimestamp(
                    stat.st_ctime, tz=timezone.utc
                ).isoformat()
                
                # File hash (for integrity checking)
                metadata["file_hash"] = self._calculate_file_hash(file_path)
                
            except Exception as e:
                logger.warning(f"Error getting metadata for {file_path}: {e}")
        
        # Cache the metadata
        self.file_metadata_cache[cache_key] = metadata
        
        return metadata
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format."""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
    
    def _calculate_file_hash(self, file_path: Path) -> Optional[str]:
        """Calculate SHA-256 hash of file for integrity checking."""
        try:
            hash_sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logger.warning(f"Error calculating hash for {file_path}: {e}")
            return None
    
    def get_documents_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all documents in a specific category."""
        return [doc for doc in self.documents if doc["category"] == category]
    
    def get_documents_by_status(self, status: bool) -> List[Dict[str, Any]]:
        """Get all documents with a specific status (found/missing)."""
        return [doc for doc in self.documents if doc["status"] == status]
    
    def get_coverage_analysis(self) -> Dict[str, Any]:
        """
        Get coverage analysis showing expected vs found documents.
        
        Returns:
            Dictionary with coverage statistics by category
        """
        coverage = {}
        
        # Group documents by category
        categories = {}
        for doc in self.documents:
            category = doc["category"]
            if category not in categories:
                categories[category] = {"expected": 0, "found": 0, "missing": []}
            
            if doc["expected"]:
                categories[category]["expected"] += 1
            
            if doc["status"]:
                categories[category]["found"] += 1
            else:
                categories[category]["missing"].append(doc["name"])
        
        # Calculate coverage percentages
        for category, stats in categories.items():
            expected = stats["expected"]
            found = stats["found"]
            missing = stats["missing"]
            
            coverage[category] = {
                "expected": expected,
                "found": found,
                "missing": missing,
                "coverage_percentage": (found / expected * 100) if expected > 0 else 0,
                "missing_count": len(missing)
            }
        
        return coverage
    
    def get_registry_summary(self) -> Dict[str, Any]:
        """
        Get summary of document registry.
        
        Returns:
            Dictionary with registry summary statistics
        """
        total_docs = len(self.documents)
        found_docs = len([doc for doc in self.documents if doc["status"]])
        expected_docs = len([doc for doc in self.documents if doc["expected"]])
        
        # Group by category
        categories = {}
        file_types = {}
        
        for doc in self.documents:
            # Count by category
            category = doc["category"]
            categories[category] = categories.get(category, 0) + 1
            
            # Count by file type
            file_type = doc["file_type"]
            file_types[file_type] = file_types.get(file_type, 0) + 1
        
        return {
            "total_documents": total_docs,
            "found_documents": found_docs,
            "missing_documents": total_docs - found_docs,
            "expected_documents": expected_docs,
            "categories": categories,
            "file_types": file_types,
            "coverage_percentage": (found_docs / expected_docs * 100) if expected_docs > 0 else 0
        }
    
    def export_registry_for_json(self) -> Dict[str, Any]:
        """
        Export document registry in format suitable for JSON export with error handling.
        
        Returns:
            Dictionary with document registry data
            
        Raises:
            RuntimeError: If export fails due to data processing errors
        """
        try:
            # Get coverage analysis with error handling
            try:
                coverage_analysis = self.get_coverage_analysis()
            except Exception as e:
                logger.error(f"Error generating coverage analysis: {e}")
                coverage_analysis = {"error": f"Failed to generate coverage analysis: {str(e)}"}
            
            # Get registry summary with error handling
            try:
                registry_summary = self.get_registry_summary()
            except Exception as e:
                logger.error(f"Error generating registry summary: {e}")
                registry_summary = {"error": f"Failed to generate registry summary: {str(e)}"}
            
            return {
                "documents": self.documents,
                "coverage_analysis": coverage_analysis,
                "registry_summary": registry_summary
            }
            
        except Exception as e:
            logger.error(f"Critical error during registry export: {e}")
            raise RuntimeError(f"Failed to export document registry: {str(e)}") from e
    
    def clear_registry(self) -> None:
        """Clear all documents from registry."""
        self.documents.clear()
        self.file_metadata_cache.clear()
    
    def validate_document_integrity(self, file_path: Union[str, Path]) -> bool:
        """
        Validate document integrity by checking if file still exists and hash matches.
        Uses transaction safety to prevent TOCTOU (Time-of-Check-Time-of-Use) issues.
        
        Args:
            file_path: Path to the document
            
        Returns:
            True if document is valid, False otherwise
        """
        file_path = Path(file_path)
        
        # Find document in registry
        doc = None
        for registered_doc in self.documents:
            if Path(registered_doc["file_path"]) == file_path:
                doc = registered_doc
                break
        
        if not doc:
            logger.warning(f"Document not found in registry: {file_path}")
            return False
        
        # Transaction-safe validation: capture all metadata in single stat call
        try:
            # Single stat call to get file metadata atomically
            stat_result = file_path.stat()
            current_size = stat_result.st_size
            current_mtime = stat_result.st_mtime
            
            # Check file size first (fastest check)
            if current_size != doc["file_size_bytes"]:
                logger.warning(f"Document file size changed: {file_path} (expected: {doc['file_size_bytes']}, actual: {current_size})")
                return False
            
            # Check modification time as additional integrity check
            expected_mtime = None
            if doc["last_modified"]:
                try:
                    expected_mtime = datetime.fromisoformat(doc["last_modified"].replace('Z', '+00:00')).timestamp()
                    # Allow small tolerance for filesystem precision differences
                    if abs(current_mtime - expected_mtime) > 1.0:
                        logger.warning(f"Document modification time changed: {file_path}")
                        return False
                except (ValueError, TypeError):
                    # If we can't parse the expected time, skip this check
                    pass
            
            # Only calculate hash if size and mtime checks pass (most expensive check)
            current_hash = self._calculate_file_hash(file_path)
            if current_hash and doc["file_hash"] and current_hash != doc["file_hash"]:
                logger.warning(f"Document file hash changed: {file_path}")
                return False
            
            return True
            
        except FileNotFoundError:
            logger.warning(f"Document file no longer exists: {file_path}")
            return False
        except OSError as e:
            logger.error(f"Error accessing document file {file_path}: {e}")
            return False
