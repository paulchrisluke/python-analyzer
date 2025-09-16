#!/usr/bin/env node

/**
 * Document Sync Script for Audiology Clinic Sale
 * 
 * This script helps sync documents from local folders to Vercel Blob
 * with proper phase-based naming conventions.
 * 
 * Usage:
 *   node scripts/sync-documents.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be uploaded without actually uploading
 *   --phase      Specify phase (p1, p2a, p2b, p3a, p3b, p4, p5, legal)
 *   --category   Specify category (financials, legal, equipment, operational, corporate, other)
 *   --help       Show this help message
 */

import { put } from '@vercel/blob';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Phase definitions based on audiology clinic sale best practices
const PHASES = {
  p1: {
    name: 'Initial Interest',
    description: 'Company overview, practice stats, basic financials',
    access: ['buyer', 'admin'],
    blobAccess: 'private' // Sensitive documents should be private
  },
  p2a: {
    name: 'Pre-Qualification', 
    description: 'High-level financial summaries, staff overview',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  p2b: {
    name: 'Post-NDA',
    description: 'Detailed financials, lease summaries, ownership docs',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  p3a: {
    name: 'Due Diligence Start',
    description: 'Full financials, contracts, licenses',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  p3b: {
    name: 'Advanced Due Diligence',
    description: 'Staff contracts, patient demographics, equipment',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  p4: {
    name: 'Negotiation',
    description: 'Draft agreements, transition plans',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  p5: {
    name: 'Closing',
    description: 'Final agreements, closing docs',
    access: ['buyer', 'admin'],
    blobAccess: 'private'
  },
  legal: {
    name: 'Legal Review',
    description: 'All legal documents, contracts, compliance',
    access: ['lawyer', 'admin'],
    blobAccess: 'private'
  }
};

const CATEGORIES = [
  'financials',
  'legal', 
  'equipment',
  'operational',
  'corporate',
  'other'
];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    phase: null,
    category: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--phase':
        if (i + 1 < args.length) {
          options.phase = args[++i];
        } else {
          console.error('❌ Error: --phase requires a value');
          process.exit(1);
        }
        break;
      case '--category':
        if (i + 1 < args.length) {
          options.category = args[++i];
        } else {
          console.error('❌ Error: --category requires a value');
          process.exit(1);
        }
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  return options;
}

// Generate filename based on phase and category
function generateFilename(filePath, phase, category) {
  const originalName = basename(filePath);
  const extension = extname(originalName);
  const nameWithoutExt = originalName.replace(extension, '');
  
  // Extract date from filename if present (YYYY-MM-DD pattern)
  const dateMatch = nameWithoutExt.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
  
  // Determine subtype based on category and filename
  let subtype = 'general';
  if (category === 'financials') {
    if (nameWithoutExt.toLowerCase().includes('balance')) subtype = 'balance_sheet';
    else if (nameWithoutExt.toLowerCase().includes('profit') || nameWithoutExt.toLowerCase().includes('p&l')) subtype = 'profit_loss';
    else if (nameWithoutExt.toLowerCase().includes('tax')) subtype = 'tax_returns';
    else if (nameWithoutExt.toLowerCase().includes('bank')) subtype = 'bank_statements';
    else if (nameWithoutExt.toLowerCase().includes('cogs')) subtype = 'cogs';
    else if (nameWithoutExt.toLowerCase().includes('ledger')) subtype = 'general_ledger';
    else subtype = 'financials';
  } else if (category === 'legal') {
    if (nameWithoutExt.toLowerCase().includes('lease')) subtype = 'leases';
    else if (nameWithoutExt.toLowerCase().includes('insurance')) subtype = 'insurance';
    else if (nameWithoutExt.toLowerCase().includes('contract')) subtype = 'contracts';
    else if (nameWithoutExt.toLowerCase().includes('license')) subtype = 'licenses';
    else subtype = 'legal';
  } else if (category === 'equipment') {
    if (nameWithoutExt.toLowerCase().includes('quote')) subtype = 'quotes';
    else if (nameWithoutExt.toLowerCase().includes('maintenance')) subtype = 'maintenance';
    else if (nameWithoutExt.toLowerCase().includes('warranty')) subtype = 'warranties';
    else subtype = 'equipment';
  } else if (category === 'operational') {
    if (nameWithoutExt.toLowerCase().includes('sales')) subtype = 'sales_data';
    else if (nameWithoutExt.toLowerCase().includes('patient')) subtype = 'patient_data';
    else if (nameWithoutExt.toLowerCase().includes('staff')) subtype = 'staff_data';
    else subtype = 'operational';
  } else if (category === 'corporate') {
    if (nameWithoutExt.toLowerCase().includes('incorporation')) subtype = 'incorporation';
    else if (nameWithoutExt.toLowerCase().includes('bylaw')) subtype = 'bylaws';
    else if (nameWithoutExt.toLowerCase().includes('board')) subtype = 'board_minutes';
    else subtype = 'corporate';
  }

  // Clean up the original name for the filename
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${phase}_${category}_${subtype}_${date}_${cleanName}${extension}`;
}

// Recursively find all files in a directory
function findFiles(dir, extensions = ['.pdf', '.csv', '.xlsx', '.doc', '.docx']) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
  }
  
  return files;
}

// Upload a single file
async function uploadFile(filePath, phase, category, dryRun = false) {
  const filename = generateFilename(filePath, phase, category);
  
  console.log(`📄 ${dryRun ? '[DRY RUN]' : ''} ${filePath}`);
  console.log(`   → ${filename}`);
  
  if (dryRun) {
    return { success: true, filename, dryRun: true };
  }
  
  try {
    const fileBuffer = readFileSync(filePath);
    
    // Determine access level based on phase
    const phaseConfig = PHASES[phase];
    const accessLevel = 'public'; // Vercel Blob API requires 'public' access
    
    const { url } = await put(filename, fileBuffer, {
      access: accessLevel,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    console.log(`   ✅ Uploaded (${accessLevel}): ${filename}`);
    console.log(`   🔒 Access: ${accessLevel} - Phase: ${phase} (${phaseConfig?.name || 'Unknown'})`);
    return { success: true, filename, url, access: accessLevel };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, filename, error: error.message };
  }
}

// Main sync function
async function syncDocuments(options) {
  console.log('🏥 Audiology Clinic Document Sync Tool\n');
  
  if (options.help) {
    console.log('Usage: node scripts/sync-documents.js [options]\n');
    console.log('Options:');
    console.log('  --dry-run    Show what would be uploaded without actually uploading');
    console.log('  --phase      Specify phase (p1, p2a, p2b, p3a, p3b, p4, p5, legal)');
    console.log('  --category   Specify category (financials, legal, equipment, operational, corporate, other)');
    console.log('  --help       Show this help message\n');
    console.log('Phases:');
    Object.entries(PHASES).forEach(([key, phase]) => {
      console.log(`  ${key}: ${phase.name} - ${phase.description}`);
    });
    return;
  }
  
  // Validate phase
  if (options.phase && !PHASES[options.phase]) {
    console.error(`❌ Invalid phase: ${options.phase}`);
    console.error(`Valid phases: ${Object.keys(PHASES).join(', ')}`);
    return;
  }
  
  // Validate category
  if (options.category && !CATEGORIES.includes(options.category)) {
    console.error(`❌ Invalid category: ${options.category}`);
    console.error(`Valid categories: ${CATEGORIES.join(', ')}`);
    return;
  }
  
  // Check for BLOB_READ_WRITE_TOKEN
  if (!process.env.BLOB_READ_WRITE_TOKEN && !options.dryRun) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
    return;
  }
  
  // Find documents directory
  const docsDir = join(process.cwd(), '..', 'docs');
  console.log(`📁 Scanning documents directory: ${docsDir}\n`);
  
  const results = {
    uploaded: 0,
    failed: 0,
    skipped: 0
  };
  
  // If specific phase and category are provided, look in that specific folder
  if (options.phase && options.category) {
    const targetDir = join(docsDir, options.category);
    const files = findFiles(targetDir);
    
    console.log(`🎯 Processing ${files.length} files in ${options.category}/ for phase ${options.phase}\n`);
    
    for (const file of files) {
      const result = await uploadFile(file, options.phase, options.category, options.dryRun);
      if (result.success) {
        results.uploaded++;
      } else {
        results.failed++;
      }
    }
  } else {
    // Process all categories
    for (const category of CATEGORIES) {
      const categoryDir = join(docsDir, category);
      const files = findFiles(categoryDir);
      
      if (files.length === 0) continue;
      
      console.log(`📂 Category: ${category} (${files.length} files)`);
      
      // Determine appropriate phase for this category
      let phase = 'p3a'; // Default to due diligence phase for new documents
      if (options.phase) {
        phase = options.phase;
      } else {
        // Auto-assign phases based on category
        switch (category) {
          case 'financials':
            phase = 'p3a'; // Due diligence phase
            break;
          case 'legal':
            phase = 'p3a'; // Due diligence phase
            break;
          case 'equipment':
            phase = 'p3b'; // Advanced due diligence
            break;
          case 'operational':
            phase = 'p3b'; // Advanced due diligence
            break;
          case 'corporate':
            phase = 'p2b'; // Post-NDA
            break;
          case 'other':
            phase = 'p1'; // Initial interest
            break;
        }
      }
      
      console.log(`   Phase: ${phase} (${PHASES[phase]?.name || 'Unknown'})\n`);
      
      for (const file of files) {
        const result = await uploadFile(file, phase, category, options.dryRun);
        if (result.success) {
          results.uploaded++;
        } else {
          results.failed++;
        }
      }
      
      console.log(''); // Empty line between categories
    }
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   ✅ Uploaded: ${results.uploaded}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  
  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Use without --dry-run to actually upload files.');
  }
}

// Run the script
const options = parseArgs();
syncDocuments(options).catch(console.error);
