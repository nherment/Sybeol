var now = new Date();
var measureDate = new Date(
                            now.getUTCFullYear(),
                            now.getUTCMonth(),
                            now.getUTCDate(),
                            now.getUTCHours(),
                            now.getUTCMinutes(),
                            now.getUTCSeconds(),
                            0
                        );

console.log("now: "+now+", ms: "+now.getTime());
console.log("utc: "+measureDate+", ms: "+measureDate.getTime());
