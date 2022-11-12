import { UITypes } from 'nocodb-sdk'
import TemplateGenerator from './TemplateGenerator'

export default class ExcelTemplateAdapter extends TemplateGenerator {
  config: Record<string, any>

  excelData: any

  project: {
    tables: Record<string, any>[]
  }

  data: Record<string, any> = {}

  wb: any

  xlsx: typeof import('xlsx')

  constructor(data = {}, parserConfig = {}) {
    super()
    this.config = parserConfig
    this.excelData = data
    this.project = {
      tables: [],
    }
    this.xlsx = {} as any
  }

  async init() {
    this.xlsx = await import('xlsx')

    const options = {
      cellText: true,
      cellDates: true,
    }

    this.wb = this.xlsx.read(new Uint8Array(this.excelData), {
      type: 'array',
      ...options,
    })
  }

  async parse() {
    const tableNamePrefixRef: Record<string, any> = {}
    await Promise.all(
      this.wb.SheetNames.map((sheetName: string) =>
        (async (sheet) => {
          await new Promise((resolve) => {
            const columnNamePrefixRef: Record<string, any> = { id: 0 }
            // TODO(import): table name
            let tn: string = (sheet || 'table').replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_').trim()

            while (tn in tableNamePrefixRef) {
              tn = `${tn}${++tableNamePrefixRef[tn]}`
            }
            tableNamePrefixRef[tn] = 0

            const table = { table_name: tn, ref_table_name: tn, columns: [] as any[] }
            const ws: any = this.wb.Sheets[sheet]
            const range = this.xlsx.utils.decode_range(ws['!ref'])
            let rows: any = this.xlsx.utils.sheet_to_json(ws, {
              // header has to be 1 disregarding this.config.firstRowAsHeaders
              // so that it generates an array of arrays
              header: 1,
              blankrows: false,
              defval: null,
            })

            // fix precision bug & timezone offset issues introduced by xlsx
            const basedate = new Date(1899, 11, 30, 0, 0, 0)
            // number of milliseconds since base date
            const dnthresh = basedate.getTime() + (new Date().getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000
            // number of milliseconds in a day
            const day_ms = 24 * 60 * 60 * 1000
            // handle date1904 property
            const fixImportedDate = (date: Date) => {
              const parsed = this.xlsx.SSF.parse_date_code((date.getTime() - dnthresh) / day_ms, {
                date1904: this.wb.Workbook.WBProps.date1904,
              })
              return new Date(parsed.y, parsed.m, parsed.d, parsed.H, parsed.M, parsed.S)
            }

            // fix imported date
            rows = rows.map((r: any) =>
              r.map((v: any) => {
                return v instanceof Date ? fixImportedDate(v) : v
              }),
            )

            for (let col = 0; col < rows[0].length; col++) {
              let cn: string = (
                (this.config.firstRowAsHeaders && rows[0] && rows[0][col] && rows[0][col].toString().trim()) ||
                `field_${col + 1}`
              )
                .replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_')
                .trim()

              while (cn in columnNamePrefixRef) {
                cn = `${cn}${++columnNamePrefixRef[cn]}`
              }
              columnNamePrefixRef[cn] = 0

              const column: Record<string, any> = {
                column_name: cn,
                ref_column_name: cn,
                meta: {},
                uidt: UITypes.SingleLineText,
              }

              table.columns.push(column)
            }
            this.project.tables.push(table)

            this.data[tn] = []

            // import data
            let rowIndex = 0
            for (const row of rows.slice(1)) {
              const rowData: Record<string, any> = {}
              for (let i = 0; i < table.columns.length; i++) {
                const cellId = this.xlsx.utils.encode_cell({
                  c: range.s.c + i,
                  r: rowIndex + +this.config.firstRowAsHeaders,
                })
                const cellObj = ws[cellId]
                rowData[table.columns[i].column_name] = (cellObj && cellObj.w) || row[i]
              }
              this.data[tn].push(rowData)
              rowIndex++
            }
            resolve(true)
          })
        })(sheetName),
      ),
    )
  }

  getTemplate() {
    return this.project
  }

  getData() {
    return this.data
  }

  getColumns() {
    return this.project.tables.map((t: Record<string, any>) => t.columns)
  }
}
