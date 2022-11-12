import { UITypes } from 'nocodb-sdk'
import TemplateGenerator from './TemplateGenerator'

const extractNestedData: any = (obj: any, path: any) => path.reduce((val: any, key: any) => val && val[key], obj)

export default class JSONTemplateAdapter extends TemplateGenerator {
  config: Record<string, any>
  data: Record<string, any>
  _jsonData: string | Record<string, any>
  jsonData: Record<string, any>
  project: {
    tables: Record<string, any>[]
  }

  columns: object
  constructor(data: object, parserConfig = {}) {
    super()
    this.config = parserConfig
    this._jsonData = data
    this.project = {
      tables: [],
    }
    this.jsonData = []
    this.data = []
    this.columns = {}
  }

  async init() {
    const parsedJsonData =
      typeof this._jsonData === 'string'
        ? // for json editor
          JSON.parse(this._jsonData)
        : // for file upload
          JSON.parse(new TextDecoder().decode(this._jsonData as BufferSource))
    this.jsonData = Array.isArray(parsedJsonData) ? parsedJsonData : [parsedJsonData]
  }

  getColumns(): any {
    return this.columns
  }

  getData(): any {
    return this.data
  }

  parse(): any {
    const tn = 'table'
    const table: any = { table_name: tn, ref_table_name: tn, columns: [] }

    this.data[tn] = []

    for (const col of Object.keys(this.jsonData[0])) {
      const columns = this._parseColumn([col])
      table.columns.push(...columns)
    }

    if (this.config.shouldImportData) {
      this._parseTableData(table)
    }

    this.project.tables.push(table)
  }

  getTemplate() {
    return this.project
  }

  _parseColumn(path: any = [], firstRowVal = path.reduce((val: any, k: any) => val && val[k], this.jsonData[0])): any {
    const columns = []
    // parse nested
    if (firstRowVal && typeof firstRowVal === 'object' && !Array.isArray(firstRowVal) && this.config.normalizeNested) {
      for (const key of Object.keys(firstRowVal)) {
        const normalizedNestedColumns = this._parseColumn([...path, key], firstRowVal[key])
        columns.push(...normalizedNestedColumns)
      }
    } else {
      const cn = path.join('_').replace(/\W/g, '_').trim()
      columns.push({
        column_name: cn,
        ref_column_name: cn,
        uidt: UITypes.SingleLineText,
        path,
      })
    }
    return columns
  }

  _parseTableData(tableMeta: any) {
    for (const row of this.jsonData as any) {
      const rowData: any = {}
      for (let i = 0; i < tableMeta.columns.length; i++) {
        const value = extractNestedData(row, tableMeta.columns[i].path || [])
        rowData[tableMeta.columns[i].column_name] = value
      }
      this.data[tableMeta.ref_table_name].push(rowData)
    }
  }
}
