#!/usr/bin/env node

/**
 * Restore Blob Storage from Local Files with Original Naming
 * 
 * This script uploads local files from the docs folder to blob storage
 * using the original naming convention from the backup.
 * 
 * Usage:
 *   node scripts/restore-from-local.js
 */

import { put, del, list } from '@vercel/blob';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Original naming mapping from backup
const ORIGINAL_NAMES = {
  // Equipment files with original inconsistent casing
  '2019-11-06_CelloAudiometer_CosmeticHearingSolutions.csv': '1757932688109_equipment_2019-11-06_Celloaudiometer_Cosmetichearingsolutions.csv',
  '2019-11-06_Starkey_EquipmentQuotation_CelloAudiometer_CosmeticHearingSolutions.pdf': '1757932688109_equipment_2019-11-06_Starkey_EquipmentQuotation_CelloAudiometer_CosmeticHearingSolutions.pdf',
  '2019-11-08_CelloAudiometer_TrumpetREM_CranberryHearing.csv': '1757932688109_equipment_2019-11-08_Celloaudiometer_Trumpetrem_Cranberryhearing.csv',
  '2019-11-08_Starkey_EquipmentQuotation_CelloAudiometer_TrumpetREM_CranberryHearing.pdf': '1757932688109_equipment_2019-11-08_Starkey_EquipmentQuotation_CelloAudiometer_TrumpetREM_CranberryHearing.pdf',
  '2019-11-11_Starkey_EquipmentQuotation_TrumpetREM_AudiometerCombo_CranberryHearing.pdf': '1757932688109_equipment_2019-11-11_Starkey_EquipmentQuotation_TrumpetREM_AudiometerCombo_CranberryHearing.pdf',
  '2019-11-11_TrumpetREM_AudiometerCombo_CranberryHearing.csv': '1757932690901_equipment_2019-11-11_Trumpetrem_Audiometercombo_Cranberryhearing.csv',
  
  // Operational files with original naming
  '2021-05-20_to_2024-12-05_HearingAidSalesCancellations_CranberryHearing.csv': '1757932735752_operational_Heading_Aid_Sales_Data_2021-05-20_to_2024-12-05_HearingAidSalesCancellations_CranberryHearing.xlsx.csv',
};

async function restoreFromLocal() {
  console.log('🔄 Starting restore from local files with original naming...');
  
  try {
    // Clear existing blobs first
    console.log('🗑️  Clearing existing blob storage...');
    const { blobs: existingBlobs } = await list({ limit: 1000 });
    
    for (const blob of existingBlobs) {
      console.log(`   Deleting: ${blob.pathname}`);
      await del(blob.url);
    }
    
    console.log(`✅ Cleared ${existingBlobs.length} existing files`);
    
    // Upload equipment files
    console.log('📤 Uploading equipment files...');
    const equipmentDir = join(process.cwd(), '..', 'docs', 'equipment');
    const equipmentFiles = readdirSync(equipmentDir);
    
    for (const file of equipmentFiles) {
      if (file.startsWith('.')) continue;
      
      const filePath = join(equipmentDir, file);
      const fileBuffer = readFileSync(filePath);
      
      // Use original naming if available, otherwise use current name
      const originalName = ORIGINAL_NAMES[file] || file;
      
      await put(originalName, fileBuffer, {
        access: 'public',
        addRandomSuffix: false
      });
      
      console.log(`   ✅ Uploaded: ${originalName}`);
    }
    
    // Upload operational files
    console.log('📤 Uploading operational files...');
    const operationalDir = join(process.cwd(), '..', 'docs', 'operational', 'Heading_Aid_Sales_Data');
    const operationalFiles = readdirSync(operationalDir);
    
    for (const file of operationalFiles) {
      if (file.startsWith('.')) continue;
      
      const filePath = join(operationalDir, file);
      const fileBuffer = readFileSync(filePath);
      
      // Use original naming if available, otherwise use current name
      const originalName = ORIGINAL_NAMES[file] || file;
      
      await put(originalName, fileBuffer, {
        access: 'public',
        addRandomSuffix: false
      });
      
      console.log(`   ✅ Uploaded: ${originalName}`);
    }
    
    console.log('🎉 Restore from local files complete!');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// Run the restore
restoreFromLocal();
