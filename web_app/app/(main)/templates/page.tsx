'use client';
import TemplateManager from './components/TemplateManager';

const TemplatePage = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    {/* Optional: You could add a page title or breadcrumbs here 
                        if the Manager title isn't enough */}
                    <TemplateManager />
                </div>
            </div>
        </div>
    );
};

export default TemplatePage;