import Badge from "@/templates/Badge";
import React from "react";


// Item template for any dropdown option
export const itemTemplate = (option: any) => {
    if (!option) return null;
    return <Badge type="status" value={option} />;
};

// Value template for selected value
export const valueTemplate = (option: any) => {
    return option ? <Badge type="status" value={option} /> : <span>Select</span>;
};
