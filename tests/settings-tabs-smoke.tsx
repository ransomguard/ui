import {createRoot} from "react-dom/client";
import {createMemoryRouter,RouterProvider} from "react-router";
import SettingsPage from "@/pages/settings";
import {RecoveryScopeBadge} from "@/components/recovery-scope-badge";
import {JevKeyBadge} from "@/components/jev-key-badge";
const api={
 getRecoveryScopeStatus:async()=>({configured:false}),getJevKeyStatus:async()=>({configured:false}),
 getRecoverySettings:async()=>({protectedRoot:"",ready:false,snapshotBudgetGiB:8,files:0,blockedReason:null}),
 getConsoleSettings:async()=>({visible:false,collectOwnDbEvents:false}),
 getSnapshotSettings:async()=>({intervalMinutes:60,task:{},error:null}),
 getSnapshotInventory:async()=>({snapshots:[],errors:[]})
};
Object.defineProperty(window,"electronAPI",{value:api});
const router=createMemoryRouter([{path:"/settings",element:<><RecoveryScopeBadge/><JevKeyBadge/><SettingsPage/></>}],{initialEntries:["/settings"]});
createRoot(document.getElementById("root")!).render(<RouterProvider router={router}/>);
