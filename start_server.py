#!/usr/bin/env python3
"""
Simple HTTP server for Video Proctoring System
Run with: python3 start_server.py
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 3000
DIRECTORY = "public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the project directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)
    
    if not os.path.exists(DIRECTORY):
        print(f"Error: {DIRECTORY} directory not found!")
        return
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🎯 Video Proctoring System Server")
        print(f"📂 Serving files from: {os.path.abspath(DIRECTORY)}")
        print(f"🌐 Server running at: http://localhost:{PORT}")
        print(f"🚀 Demo version: http://localhost:{PORT}/demo.html")
        print(f"🧪 Test page: http://localhost:{PORT}/test.html")
        print(f"⚫ Full version: http://localhost:{PORT}/index.html")
        print(f"\\n Press Ctrl+C to stop the server")
        
        # Auto-open browser to demo page
        webbrowser.open(f'http://localhost:{PORT}/demo.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\\n🛑 Server stopped by user")

if __name__ == "__main__":
    main()