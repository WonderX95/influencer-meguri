'use client'
import dynamic from 'next/dynamic'
const DynamicPDFViewer = dynamic(() => import('@/features/projects/pages/common/pafViewer'), {
    ssr: false,
})
function CompanyManualPage() {
    return (
        <div className='pt-[200px]'>
            <DynamicPDFViewer url="/pdf/test.pdf" />
        </div>
    );
}
export default CompanyManualPage;
