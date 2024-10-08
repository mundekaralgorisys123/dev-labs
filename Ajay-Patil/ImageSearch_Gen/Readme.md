# Complete Project Setup

## One-Time Setup for Nginx and Gunicorn

## Nginx Configuration

1. **Configure Nginx with the App (`ai_tools`)**:
   Add the below text in the `ai_tools` file:

   ```
   server {
       listen 80;
       server_name your_domain_or_ip;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Enable the site**:

   ```bash
   sudo ln -s /etc/nginx/sites-available/ai_tools /etc/nginx/sites-enabled
   ```

3. **Test Nginx Configuration**:

   ```bash
   sudo nginx -t
   ```

4. **Restart Nginx**:

   ```bash
   sudo systemctl restart nginx
   ```

5. **Allow Nginx through the firewall**:

   ```bash
   sudo ufw allow 'Nginx Full'
   ```

---

## Install and Configure Gunicorn

1. **Activate Your Virtual Environment**:

   ```bash
   cd /var/www/html
   source venv/bin/activate
   ```

2. **Install Gunicorn**:

   ```bash
   pip install gunicorn
   ```

3. **Run the Flask App Using Gunicorn**:

   ```bash
   gunicorn --bind 0.0.0.0:5000 app:app
   ```

---

## Using `systemd` to Keep the Flask App Running

1. **Create a `systemd` Service File**:

   ```bash
   sudo nano /etc/systemd/system/flaskapp_image.service
   ```

2. **Add the Following Configuration**:

   ```ini
   [Unit]
   Description=Gunicorn instance to serve Flask app
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/html
   Environment="PATH=/var/www/html/venv/bin"
   ExecStart=/var/www/html/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 app:app

   [Install]
   WantedBy=multi-user.target
   ```

3. **Reload `systemd` and Start the Flask App**:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start flaskapp_image
   sudo systemctl enable flaskapp_image
   ```

4. **Check the Status**:

   ```bash
   sudo systemctl status flaskapp_image
   ```
