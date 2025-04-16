/* eslint-disable @next/next/no-img-element */

const AppFooter = () => {


    return (
        <div className="layout-footer">
            <img src={`/images/wku_logo.png`} alt="logo" height="20" className="mr-2" />
            by
            <span className="font-medium ml-2">Wolkite University</span>
        </div>
    );
};

export default AppFooter;
