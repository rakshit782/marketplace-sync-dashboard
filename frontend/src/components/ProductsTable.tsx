import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';

interface Product {
  asin?: string;
  sku: string;
  productName?: string;
  itemName?: string;
  brand?: string;
  primaryImageUrl?: string;
  images?: any[];
}

interface ProductsTableProps {
  products: Product[];
  marketplace: 'amazon' | 'walmart';
  apiUrl: string;
}

function ProductsTable({ products, marketplace }: ProductsTableProps) {
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: (info) => (
          <div className="font-mono text-sm">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: marketplace === 'amazon' ? 'asin' : 'sku',
        header: marketplace === 'amazon' ? 'ASIN' : 'Item ID',
        cell: (info) => (
          <div className="font-mono text-sm text-gray-600">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: marketplace === 'amazon' ? 'itemName' : 'productName',
        header: 'Product Name',
        cell: (info) => (
          <div className="max-w-md truncate">
            {(info.getValue() as string) || 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'brand',
        header: 'Brand',
        cell: (info) => (
          <div className="text-sm text-gray-700">
            {(info.getValue() as string) || 'N/A'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            View
          </button>
        ),
      },
    ],
    [marketplace]
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found
        </div>
      )}
    </div>
  );
}

export default ProductsTable;