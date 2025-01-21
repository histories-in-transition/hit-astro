import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

document.getElementById('download-pdf').addEventListener('click', async () => {
    const element = document.querySelector("article"); // Target the container to render
    const canvas = await html2canvas(element, {
        scale: 4, // Higher scale for better resolution
        useCORS: true, // Enable cross-origin if there are external resources
    });

    const margin = 10; // Margin in mm (applies to all sides)
    const pdf = new jsPDF('p', 'mm', 'a4'); // Initialize PDF with portrait A4 size

    const pdfWidth = pdf.internal.pageSize.getWidth(); // Total PDF width
    const pdfHeight = pdf.internal.pageSize.getHeight(); // Total PDF height
    const contentWidth = pdfWidth - margin * 2; // Content width after margins
    const contentHeight = pdfHeight - margin * 2; // Content height after margins

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const scale = contentWidth / canvasWidth; // Scale the image to fit content width

    let yOffset = 0; // Y-offset to track content height

    // Loop through and add each page
    while (yOffset < canvasHeight) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = Math.min(canvasHeight - yOffset, contentHeight / scale); // Height of the cropped part

        const context = pageCanvas.getContext('2d');
        context.drawImage(
            canvas,
            0, yOffset, canvasWidth, pageCanvas.height, // Source rectangle
            0, 0, canvasWidth, pageCanvas.height // Destination rectangle
        );

        const pageImgData = pageCanvas.toDataURL('image/png'); // Crop to image
        const pageImgHeightScaled = (pageCanvas.height * contentWidth) / canvasWidth; // Scaled height for the PDF

        // Add cropped image to PDF with margins
        pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, pageImgHeightScaled);

        yOffset += pageCanvas.height; // Increment the offset
        if (yOffset < canvasHeight) pdf.addPage(); // Add new page if content remains
    }

    // Save the PDF
    pdf.save('manuscript.pdf');
});
