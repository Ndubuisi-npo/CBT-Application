export function getImportProgressCount(payload) {
  const data = payload?.data ?? payload?.progress ?? payload
  const count = [
    data?.processed_rows,
    data?.processedRows,
    data?.rows_processed,
    data?.rowsProcessed,
    data?.completed_rows,
    data?.completedRows,
    data?.current_row,
    data?.currentRow,
    data?.imported_rows,
    data?.importedRows,
    data?.imported_count,
    data?.importedCount,
    data?.successful_rows,
    data?.successfulRows,
    data?.processed,
    data?.completed,
    data?.imported,
    data?.current,
    data?.count,
  ].find((value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)))

  return count === undefined ? null : Math.max(0, Number(count))
}
