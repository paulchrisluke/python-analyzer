'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_CATEGORIES } from '@/lib/categories';

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState('admin');
  const [dueDate, setDueDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const inputFileRef = useRef<HTMLInputElement>(null);
  const categories = DEFAULT_CATEGORIES;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill name if empty
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file || !name || !category) {
      setUploadResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('category', category);
      formData.append('notes', notes);
      formData.append('visibility', visibility);
      if (dueDate) {
        formData.append('due_date', dueDate);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({ success: true, message: 'Document uploaded successfully!' });
        // Reset form
        setFile(null);
        setName('');
        setCategory('');
        setNotes('');
        setVisibility('admin');
        setDueDate('');
        if (inputFileRef.current) {
          inputFileRef.current.value = '';
        }
        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setUploadResult({ success: false, message: result.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload a new document to the system. Files are stored securely in Vercel Blob.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input
              ref={inputFileRef}
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
              required
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name} - {cat.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this document"
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="admin,buyer">Admin & Buyer</SelectItem>
                <SelectItem value="buyer">Buyer Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              uploadResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{uploadResult.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={uploading || !file || !name || !category}
            className="w-full"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
