#!/usr/bin/env node

/**
 * Simple script to upload existing JSON data files to Vercel Blob storage
 * This replaces the static JSON files with blob storage for real-time updates
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data files to upload
const dataFiles = [
  'revenue_audit_trail.json',
  'ebitda_audit_trail.json',
  'business_sale_data.json',
  'due_diligence_coverage.json',
  'equipment_analysis.json',
  'financial_summary.json',
  'landing_page_data.json',
  'location_audit_trail.json'
];

async function uploadDataToBlob() {
  console.log('🚀 Starting data upload to Vercel Blob...');
  
  const results = [];
  
  for (const filename of dataFiles) {
    try {
      const filePath = path.join(__dirname, '../public/data', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        continue;
      }
      
      // Read the JSON file
      const jsonData = fs.readFileSync(filePath, 'utf8');
      
      // Upload to Vercel Blob
      const blob = await put(`data/${filename}`, jsonData, {
        access: 'public',
        contentType: 'application/json'
      });
      
      console.log(`✅ Uploaded: ${filename} -> ${blob.url}`);
      results.push({
        filename,
        url: blob.url,
        size: jsonData.length
      });
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`Successfully uploaded ${results.length} files`);
  
  // Create a manifest file with all the URLs
  const manifest = {
    timestamp: new Date().toISOString(),
    files: results.reduce((acc, result) => {
      acc[result.filename.replace('.json', '')] = result.url;
      return acc;
    }, {})
  };
  
  // Upload the manifest
  try {
    const manifestBlob = await put('data/manifest.json', JSON.stringify(manifest, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });
    
    console.log(`✅ Uploaded manifest: ${manifestBlob.url}`);
    console.log('\n🎉 All data uploaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your frontend to fetch from blob URLs');
    console.log('2. Remove the static JSON files from /public/data/');
    console.log('3. Update your ETL pipeline to write to blob storage');
    
  } catch (error) {
    console.error('❌ Failed to upload manifest:', error.message);
  }
}

// Run the upload
uploadDataToBlob().catch(console.error);
