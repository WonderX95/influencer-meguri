'use client'
import React, { useState } from "react"
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();


interface PDFViewerProps {
    url: string
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }: { url: string }) => {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(2);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }
    return (
        <>
            <Document className={'max-w-full'} file={url} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} />
            </Document>
        </>
    )
}

export default PDFViewer