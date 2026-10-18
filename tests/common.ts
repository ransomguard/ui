import { PIPE_NAME as IPC_PIPE_NAME } from "~/services/ipc-receiver";
import { PIPE_NAME as FW_PIPE_NAME } from "~/services/firewall-tool";



export const FW_TEST_PIPE_NAME = `${FW_PIPE_NAME}_TEST_${process.pid}`;
export const IPC_TEST_PIPE_NAME = `${IPC_PIPE_NAME}_TEST_${process.pid}`;
