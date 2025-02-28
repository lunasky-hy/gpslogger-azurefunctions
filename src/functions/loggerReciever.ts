import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { jwtDecode } from "jwt-decode";

interface SimInfo {
    "operatorId": string;
    "resourceType": string;
    "resourceId": string;
    "sourceProtocol": string;
    "srn": string;
    "imsi": string;
    "simId": string;
    "imei": string;
}

interface Log {
    deviceid: string;
    timestamp: number;
    nowloc?: {
        lat: number;
        lon: number;
    };
    prevloc?: {
        lat: number;
        lon: number;
    };
}

export async function loggerReciever(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // const decodedToken = jwtDecode(request.headers.get("x-soracom-token"));
    // if (!decodedToken || !decodedToken.sub || decodedToken.sub == "func.soracom.io") {
    //     return { status: 401, body: 'Unauthorized' };
    // }
    // const simInfo: SimInfo = decodedToken["ctx"];
    const requestBody: any = await request.json();
    context.log(requestBody);

    const log: Log = {
        "deviceid": requestBody.deviceid,
        "timestamp": requestBody.timestamp,
        "nowloc": requestBody.nowloc,
        "prevloc": requestBody.prevloc
    };
    
    await saveLog(log);
    

    return { body: requestBody };
};

app.http('loggerReciever', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: loggerReciever
});

async function saveLog(log: Log) {
    // connect cosmos db
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    const database = client.database('LoggerDatabase');
    const container = database.container('Logger1');

    const logdate = __unixtime2datetime(log.timestamp);
    const datestr = `${logdate.getFullYear()}-${logdate.getMonth()}-${logdate.getDate()}`;

    const item = { deviceid: log.deviceid, date: datestr, ...log };
    return await container.items.create(item);
}

function __unixtime2datetime(unixtime: number) {
    const date = new Date(unixtime * 1000);
    return date;
}