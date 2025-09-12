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
    
    def register_document(self, file_path: Union[str, Path], 
                         category: str = "other",
                         name: Optional[str] = None,
                         notes: Optional[str] = None,
                         expected: bool = True) -> Dict[str, Any]:
        """
        Register a document with comprehensive metadata.
        
        Args:
            file_path: Path to the document file
            category: Document category (financials, legal, equipment, etc.)
            name: Custom name for the document (defaults to filename)
            notes: Optional notes about the document
            expected: Whether this document was expected to be found
            
        Returns:
            Dictionary with document metadata
        """
        file_path = Path(file_path)
        
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
                          recursive: bool = True) -> List[Dict[str, Any]]:
        """
        Register all documents in a directory.
        
        Args:
            directory_path: Path to the directory
            category: Document category for all files
            file_extensions: List of file extensions to include (e.g., ['.pdf', '.csv'])
            recursive: Whether to search subdirectories
            
        Returns:
            List of registered document metadata
        """
        directory_path = Path(directory_path)
        registered_docs = []
        
        if not directory_path.exists():
            logger.warning(f"Directory does not exist: {directory_path}")
            return registered_docs
        
        # Get all files in directory
        if recursive:
            files = list(directory_path.rglob("*"))
        else:
            files = list(directory_path.iterdir())
        
        # Filter files
        for file_path in files:
            if not file_path.is_file():
                continue
            
            # Filter by file extensions if specified
            if file_extensions:
                if file_path.suffix.lower() not in [ext.lower() for ext in file_extensions]:
                    continue
            
            # Register the document
            doc = self.register_document(file_path, category)
            registered_docs.append(doc)
        
        logger.info(f"Registered {len(registered_docs)} documents from {directory_path}")
        
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
        Export document registry in format suitable for JSON export.
        
        Returns:
            Dictionary with document registry data
        """
        return {
            "documents": self.documents,
            "coverage_analysis": self.get_coverage_analysis(),
            "registry_summary": self.get_registry_summary()
        }
    
    def clear_registry(self) -> None:
        """Clear all documents from registry."""
        self.documents.clear()
        self.file_metadata_cache.clear()
    
    def validate_document_integrity(self, file_path: Union[str, Path]) -> bool:
        """
        Validate document integrity by checking if file still exists and hash matches.
        
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
        
        # Check if file still exists
        if not file_path.exists():
            logger.warning(f"Document file no longer exists: {file_path}")
            return False
        
        # Check file size
        current_size = file_path.stat().st_size
        if current_size != doc["file_size_bytes"]:
            logger.warning(f"Document file size changed: {file_path}")
            return False
        
        # Check file hash
        current_hash = self._calculate_file_hash(file_path)
        if current_hash and doc["file_hash"] and current_hash != doc["file_hash"]:
            logger.warning(f"Document file hash changed: {file_path}")
            return False
        
        return True
