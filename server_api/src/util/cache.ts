import NodeCache from "node-cache";

export const cache = new NodeCache({
    stdTTL: 2 * 3600, // cache for 2 hour
    checkperiod: 3 * 60, // clear expired items every 3 minutes
});
