from PyPDF2 import PdfReader
import pdf2image
import boto3
from io import BytesIO
import os
from talkshop_searchutils.aws.util import get_client
import uuid
import openai

def extract_pdf_text(pdfdata):
    reader = PdfReader(pdfdata)
    text = []
    for page in reader.pages:
        text.append(page.extract_text())
    return "\n".join(text)

def getFileData(fileLocation):
    bucket, key = fileLocation.replace("s3://","").split("/")
    client = get_client('s3', os.environ.get('REGION'))
    object = client.get_object(Bucket = bucket, Key = key)
    buffer = BytesIO()
    buffer.write(object.get('Body').read())
    return buffer

def convertToImage(pdfData , **kwargs):
    pages = pdf2image.convert_from_bytes(pdfData)
    buffer = BytesIO()
    final_files = []
    for page in pages:
        if(page.height > 1024):
            div = (page.height / 1024)
            height = 1024
            width = int(page.width / div)
            page = page.resize((width, height))
        page.save(buffer, format = "PNG")
        if(kwargs.get('service') in ['openai']):
            saved_file = openai.files.create(
                file=buffer,
                purpose="vision"
            )
            final_files.append(saved_file)
    return final_files
        
def process(pipelineObject, operations = [] , **kwargs):
    outputs = {}
    fileLocation = pipelineObject.fileLocation
    buffer = getFileData(fileLocation)
    if 'text' in operations:
      buffer.seek(0)
      outputs['resume_text'] = {'data' : "Resume:\n" + extract_pdf_text(buffer) , 'type' : 'text' }
    if 'image' in operations:
        buffer.seek(0)
        outputs['resume_images'] = {'data' : outputs.append(convertToImage(buffer, **kwargs)) , 'type' : 'image' }
    return outputs
