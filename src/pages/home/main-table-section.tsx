import type * as api from "@/lib/api";

import { DataTable, columns } from "@/components/data-table";



export interface MainTableSectionProps {
	data: api.TableDataItem[];
	onDataChange: (data: api.TableDataItem[]) => void;
	isLoading?: boolean;
}

export default function MainTableSection({
	data,
	onDataChange,
	isLoading,
}: MainTableSectionProps) {
	return (
		<div className="space-y-3 min-w-0">
			<div>
				<h2 className="text-lg font-semibold tracking-tight">Data Table</h2>
			</div>
			<DataTable
				columns={columns}
				data={data}
				onDataChange={onDataChange}
				isLoading={isLoading}
			/>
		</div>
	);
}

