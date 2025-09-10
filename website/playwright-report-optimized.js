const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

class OptimizedHTMLReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'playwright-report-optimized';
    this.assetsDir = path.join(this.outputDir, 'assets');
    this.dataDir = path.join(this.outputDir, 'data');
  }

  onBegin(config, suite) {
    // Ensure output directories exist
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.mkdirSync(this.assetsDir, { recursive: true });
    fs.mkdirSync(this.dataDir, { recursive: true });

    this.config = config;
    this.suite = suite;
    this.results = [];
  }

  onTestEnd(test, result) {
    this.results.push({
      test: {
        title: test.title,
        location: test.location,
        annotations: test.annotations,
        expectedStatus: test.expectedStatus,
        timeout: test.timeout,
        retries: test.retries,
      },
      result: {
        status: result.status,
        duration: result.duration,
        errors: result.errors,
        attachments: result.attachments,
        steps: result.steps,
        stdout: result.stdout,
        stderr: result.stderr,
      }
    });
  }

  async onEnd(result) {
    // Save test results as separate JSON files
    const resultsFile = path.join(this.dataDir, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      config: this.config,
      summary: result,
      results: this.results
    }, null, 2));

    // Save individual test data files
    for (let i = 0; i < this.results.length; i++) {
      const testResult = this.results[i];
      const testId = this.generateTestId(testResult.test);
      const testDataFile = path.join(this.dataDir, `${testId}.json`);
      
      // Process attachments separately
      const processedAttachments = await this.processAttachments(testResult.result.attachments, testId);
      
      fs.writeFileSync(testDataFile, JSON.stringify({
        ...testResult,
        result: {
          ...testResult.result,
          attachments: processedAttachments
        }
      }, null, 2));
    }

    // Generate optimized HTML report
    await this.generateHTMLReport();
  }

  generateTestId(test) {
    return Buffer.from(`${test.title}-${test.location?.file}-${test.location?.line}`)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
  }

  async processAttachments(attachments, testId) {
    const processedAttachments = [];
    
    for (const attachment of attachments) {
      if (attachment.path) {
        // Copy attachment to assets directory
        const fileName = `${testId}-${attachment.name}`;
        const assetPath = path.join(this.assetsDir, fileName);
        
        try {
          await pipelineAsync(
            fs.createReadStream(attachment.path),
            createWriteStream(assetPath)
          );
          
          processedAttachments.push({
            ...attachment,
            path: `./assets/${fileName}` // Relative path for web serving
          });
        } catch (error) {
          console.warn(`Failed to copy attachment ${attachment.path}:`, error);
          processedAttachments.push(attachment);
        }
      } else {
        processedAttachments.push(attachment);
      }
    }
    
    return processedAttachments;
  }

  async generateHTMLReport() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #24292f;
        }
        .summary-card .number {
            font-size: 2em;
            font-weight: bold;
        }
        .passed { color: #2da44e; }
        .failed { color: #d1242f; }
        .skipped { color: #f85149; }
        .test-list {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .test-item {
            padding: 15px 20px;
            border-bottom: 1px solid #d0d7de;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .test-item:hover {
            background-color: #f6f8fa;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-title {
            font-weight: 600;
            margin-bottom: 5px;
        }
        .test-meta {
            font-size: 0.9em;
            color: #656d76;
        }
        .test-details {
            display: none;
            padding: 20px;
            background: #f6f8fa;
            border-top: 1px solid #d0d7de;
        }
        .test-details.active {
            display: block;
        }
        .error {
            background: #fff5f5;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 0.9em;
        }
        .attachment {
            margin: 10px 0;
            padding: 10px;
            background: #f6f8fa;
            border-radius: 6px;
        }
        .attachment img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #656d76;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Playwright Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary" id="summary">
            <div class="loading">Loading summary...</div>
        </div>
        
        <div class="test-list" id="testList">
            <div class="loading">Loading tests...</div>
        </div>
    </div>

    <script>
        class TestReport {
            constructor() {
                this.data = null;
                this.loadData();
            }

            async loadData() {
                try {
                    const response = await fetch('./data/test-results.json');
                    this.data = await response.json();
                    this.render();
                } catch (error) {
                    console.error('Failed to load test data:', error);
                    document.getElementById('summary').innerHTML = '<div class="error">Failed to load test data</div>';
                    document.getElementById('testList').innerHTML = '<div class="error">Failed to load test data</div>';
                }
            }

            render() {
                this.renderSummary();
                this.renderTestList();
            }

            renderSummary() {
                const summary = this.data.summary;
                const summaryHtml = \`
                    <div class="summary-card">
                        <h3>Total Tests</h3>
                        <div class="number">\${summary.total}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Passed</h3>
                        <div class="number passed">\${summary.passed}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Failed</h3>
                        <div class="number failed">\${summary.failed}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Skipped</h3>
                        <div class="number skipped">\${summary.skipped}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Duration</h3>
                        <div class="number">\${this.formatDuration(summary.duration)}</div>
                    </div>
                \`;
                document.getElementById('summary').innerHTML = summaryHtml;
            }

            renderTestList() {
                const testListHtml = this.data.results.map((testResult, index) => {
                    const testId = this.generateTestId(testResult.test);
                    const status = testResult.result.status;
                    const statusClass = status === 'passed' ? 'passed' : status === 'failed' ? 'failed' : 'skipped';
                    
                    return \`
                        <div class="test-item" onclick="report.toggleTestDetails(\${index})">
                            <div class="test-title">
                                <span class="\${statusClass}">\${status.toUpperCase()}</span>
                                \${testResult.test.title}
                            </div>
                            <div class="test-meta">
                                \${testResult.test.location?.file}:\${testResult.test.location?.line} • 
                                \${this.formatDuration(testResult.result.duration)}
                            </div>
                            <div class="test-details" id="details-\${index}">
                                \${this.renderTestDetails(testResult)}
                            </div>
                        </div>
                    \`;
                }).join('');
                
                document.getElementById('testList').innerHTML = testListHtml;
            }

            renderTestDetails(testResult) {
                let details = '';
                
                if (testResult.result.errors && testResult.result.errors.length > 0) {
                    details += '<h4>Errors:</h4>';
                    testResult.result.errors.forEach(error => {
                        details += \`<div class="error">\${error.message}</div>\`;
                    });
                }
                
                if (testResult.result.attachments && testResult.result.attachments.length > 0) {
                    details += '<h4>Attachments:</h4>';
                    testResult.result.attachments.forEach(attachment => {
                        if (attachment.contentType?.startsWith('image/')) {
                            details += \`
                                <div class="attachment">
                                    <strong>\${attachment.name}</strong><br>
                                    <img src="\${attachment.path}" alt="\${attachment.name}">
                                </div>
                            \`;
                        } else {
                            details += \`
                                <div class="attachment">
                                    <strong>\${attachment.name}</strong> (\${attachment.contentType || 'unknown'})
                                </div>
                            \`;
                        }
                    });
                }
                
                return details || '<p>No additional details available.</p>';
            }

            toggleTestDetails(index) {
                const details = document.getElementById(\`details-\${index}\`);
                details.classList.toggle('active');
            }

            generateTestId(test) {
                return btoa(\`\${test.title}-\${test.location?.file}-\${test.location?.line}\`)
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .substring(0, 16);
            }

            formatDuration(ms) {
                if (ms < 1000) return \`\${ms}ms\`;
                return \`\${(ms / 1000).toFixed(2)}s\`;
            }
        }

        const report = new TestReport();
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'index.html'), html);
    
    // Create a simple server script for local development
    const serverScript = `#!/usr/bin/env node
const express = require('express');
const path = require('path');

const app = express();
const port = 9323;

app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(\`Playwright report server running at http://localhost:\${port}\`);
  console.log('Press Ctrl+C to stop the server');
});
`;

    fs.writeFileSync(path.join(this.outputDir, 'server.js'), serverScript);
    
    console.log(`\n✅ Optimized Playwright report generated in: ${this.outputDir}`);
    console.log(`📊 Report size: ${this.getDirectorySize(this.outputDir)}`);
    console.log(`🚀 To view the report: cd ${this.outputDir} && node server.js`);
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }
    
    return this.formatBytes(totalSize);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = OptimizedHTMLReporter;
