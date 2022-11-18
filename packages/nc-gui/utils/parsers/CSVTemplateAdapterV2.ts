import { parse } from 'papaparse'
import type { UploadFile } from 'ant-design-vue'

export default class CSVTemplateAdapter {
  config: Record<string, any>
  source: UploadFile[] | string
  detectedColumnTypes: Record<number, Record<string, number>>
  distinctValues: Record<number, Set<string>>
  headers: Record<number, string[]>
  tables: Record<number, any>
  project: {
    tables: Record<string, any>[]
  }

  data: Record<string, any> = {}
  columnValues: Record<number, []>

  constructor(source: UploadFile[] | string, parserConfig = {}) {
    this.config = parserConfig
    this.source = source
    this.project = {
      tables: [],
    }
    this.detectedColumnTypes = {}
    this.distinctValues = {}
    this.headers = {}
    this.columnValues = {}
    this.tables = {}
  }

  async init() {}

  async initTemplate(tableIdx: number, tn: string, columnNames: string[]) {
    const columnNameRowExist = +columnNames.every((v: any) => v === null || typeof v === 'string')
    const columnNamePrefixRef: Record<string, any> = { id: 0 }

    const tableObj: Record<string, any> = {
      table_name: tn,
      ref_table_name: tn,
      columns: [],
    }

    this.headers[tableIdx] = []
    this.tables[tableIdx] = []

    for (const [columnIdx, columnName] of columnNames.entries()) {
      let cn: string = ((columnNameRowExist && columnName.toString().trim()) || `field_${columnIdx + 1}`)
        .replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_')
        .trim()
      while (cn in columnNamePrefixRef) {
        cn = `${cn}${++columnNamePrefixRef[cn]}`
      }
      columnNamePrefixRef[cn] = 0

      this.columnValues[columnIdx] = []
      tableObj.columns.push({
        column_name: cn,
        key: columnIdx,
      })

      this.headers[tableIdx].push(cn)
      this.tables[tableIdx] = tableObj
    }
  }

  async import(tableIdx: number, source: UploadFile | string) {
    return new Promise((resolve, reject) => {
      const that = this
      let steppers = 0
      const tn = `NC_IMPORT_TABLE_${(
        (this.config.importFromURL ? (source as string).split('/').pop() : (source as UploadFile).name) as string
      )
        .replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_')
        .trim()!}`

      this.data[tn] = []
      const parseSource = (this.config.importFromURL ? (source as string) : (source as UploadFile).originFileObj)!
      parse(parseSource, {
        download: that.config.importFromURL,
        worker: true,
        skipEmptyLines: 'greedy',
        step(row) {
          steppers += 1
          if (row) {
            if (steppers === 1) {
              if (that.config.firstRowAsHeaders) {
                // row.data is header
                that.initTemplate(tableIdx, tn, row.data as [])
              } else {
                // use dummy column names as header
                that.initTemplate(
                  tableIdx,
                  tn,
                  [...Array((row.data as []).length)].map((_, i) => `field_${i + 1}`),
                )
              }
            } else {
              if (steppers >= +that.config.firstRowAsHeaders + 1) {
                const rowData: Record<string, any> = {}
                for (let columnIdx = 0; columnIdx < that.headers[tableIdx].length; columnIdx++) {
                  const column = that.tables[tableIdx].columns[columnIdx]
                  const data = (row.data as [])[columnIdx] === '' ? null : (row.data as [])[columnIdx]
                  rowData[column.column_name] = data
                }
                that.data[tn].push(rowData)
              }
            }
          }
        },
        async complete() {
          that.project.tables.push(that.tables[tableIdx])
          resolve(true)
        },
        error(e: Error) {
          reject(e)
        },
      })
    })
  }

  async parse() {
    if (this.config.importFromURL) {
      await this.import(0, this.source as string)
    } else {
      await Promise.all(
        (this.source as UploadFile[]).map((file: UploadFile, tableIdx: number) =>
          (async (f, idx) => {
            await this.import(idx, f)
          })(file, tableIdx),
        ),
      )
    }
  }

  getColumns() {
    return this.project.tables.map((t: Record<string, any>) => t.columns)
  }

  getData() {
    return this.data
  }

  getTemplate() {
    return this.project
  }
}
