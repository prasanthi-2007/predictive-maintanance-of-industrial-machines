import fitz # PyMuPDF
import os
from PIL import Image

pdf_dir = r'C:\Users\prasanthi\.gemini\antigravity-ide\brain\a4c431db-9c5f-4ed9-9be4-84175e054333\.user_uploaded'
sample_pdf = os.path.join(pdf_dir, 'media_1789576839905.pdf')
cert_pdf = os.path.join(pdf_dir, 'media_1789576853833.pdf')

out_dir = r'c:\Users\prasanthi\OneDrive\文档\IBMQ2DST2217_Prototype\images'
os.makedirs(out_dir, exist_ok=True)

# 1. Render Certificate PDF
doc_cert = fitz.open(cert_pdf)
page_cert = doc_cert[0]
pix_cert = page_cert.get_pixmap(dpi=300)
cert_img_path = os.path.join(out_dir, 'certificate_of_completion.png')
pix_cert.save(cert_img_path)

img_cert = Image.open(cert_img_path)
w, h = img_cert.size

# IBM ICE Logo top left header (crop coordinates)
ibm_logo = img_cert.crop((int(w * 0.04), int(h * 0.06), int(w * 0.48), int(h * 0.17)))
ibm_logo.save(os.path.join(out_dir, 'ibm_ice_logo.png'))

# Q2D Logo bottom right corner
q2d_logo = img_cert.crop((int(w * 0.80), int(h * 0.83), int(w * 0.94), int(h * 0.96)))
q2d_logo.save(os.path.join(out_dir, 'q2d_logo.png'))

# 2. Render Sample PDF Page 0 (Title page) for ANITS logo
doc_sample = fitz.open(sample_pdf)
page_title = doc_sample[0]
pix_title = page_title.get_pixmap(dpi=300)
title_img_path = os.path.join(out_dir, 'sample_title_page.png')
pix_title.save(title_img_path)

img_title = Image.open(title_img_path)
tw, th = img_title.size
# Crop ANITS logo emblem
anits_logo = img_title.crop((int(tw * 0.35), int(th * 0.39), int(tw * 0.65), int(th * 0.58)))
anits_logo.save(os.path.join(out_dir, 'anits_logo.png'))

# Clean up temporary full page screenshot
if os.path.exists(title_img_path):
    os.remove(title_img_path)

# Return status quietly without print encoding error
with open(os.path.join(out_dir, 'status.txt'), 'w') as f:
    f.write("Logos extracted successfully!")
