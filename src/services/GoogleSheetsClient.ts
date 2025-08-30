import { BaseClient } from './BaseClient';

export interface GoogleSheetsReadResponse {
  success: boolean;
  values: any[][];
  range: string;
  majorDimension: string;
}

export interface GoogleSheetsWriteResponse {
  success: boolean;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

// Enhanced Google Sheets Types
export interface Spreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
    locale: string;
    autoRecalc: string;
    timeZone: string;
  };
  sheets: Sheet[];
}

export interface Sheet {
  properties: {
    sheetId: number;
    title: string;
    index: number;
    sheetType: 'GRID' | 'OBJECT';
    gridProperties?: {
      rowCount: number;
      columnCount: number;
      frozenRowCount?: number;
      frozenColumnCount?: number;
    };
  };
}

export interface SheetConfig {
  title: string;
  gridProperties?: {
    rowCount?: number;
    columnCount?: number;
    frozenRowCount?: number;
    frozenColumnCount?: number;
  };
}

export interface ChartSpec {
  title?: string;
  chartType: 'BAR' | 'LINE' | 'AREA' | 'COLUMN' | 'PIE' | 'SCATTER';
  sourceRange: {
    sheetId: number;
    startRowIndex: number;
    endRowIndex: number;
    startColumnIndex: number;
    endColumnIndex: number;
  };
  position?: {
    overlayPosition?: {
      anchorCell: {
        sheetId: number;
        rowIndex: number;
        columnIndex: number;
      };
      offsetXPixels?: number;
      offsetYPixels?: number;
      widthPixels?: number;
      heightPixels?: number;
    };
  };
}

export interface Chart {
  chartId: number;
  position: any;
  spec: ChartSpec;
}

export interface GoogleSheetsCreateResponse {
  success: boolean;
  spreadsheet: Spreadsheet;
}

export interface GoogleSheetsShareResponse {
  success: boolean;
  shared: boolean;
}

export interface GoogleSheetsDuplicateResponse {
  success: boolean;
  sheet: Sheet;
}

export interface GoogleSheetsProtectResponse {
  success: boolean;
  protectedRangeId: string;
}

export interface GoogleSheetsChartResponse {
  success: boolean;
  chart: Chart;
}

export class GoogleSheetsClient extends BaseClient {
  async read(params: {
    spreadsheetId: string;
    range: string;
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
  }): Promise<GoogleSheetsReadResponse> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      ...(params.valueRenderOption && { valueRenderOption: params.valueRenderOption })
    });

    const endpoint = `/api/plugins/google/sheets/read?${queryParams.toString()}`;
    return this.makeRequest<GoogleSheetsReadResponse>(endpoint);
  }

  async write(params: {
    spreadsheetId: string;
    range: string;
    values: any[][];
    operation: 'append' | 'update' | 'clear';
  }): Promise<GoogleSheetsWriteResponse> {
    const endpoint = `/api/plugins/google/sheets/write`;
    return this.makeRequest<GoogleSheetsWriteResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        companyId: this.config.companyId,
        ...params
      })
    });
  }

  // Advanced Spreadsheet Operations
  async createSpreadsheet(title: string, sheets?: SheetConfig[]): Promise<GoogleSheetsCreateResponse> {
    const body = {
      companyId: this.config.companyId,
      title,
      sheets: sheets || [{ title: 'Sheet1' }]
    };

    const endpoint = `/api/plugins/google/sheets/create`;
    return this.makeRequest<GoogleSheetsCreateResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async shareSpreadsheet(spreadsheetId: string, emails: string[], role: 'viewer' | 'editor' = 'viewer'): Promise<GoogleSheetsShareResponse> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      emails,
      role
    };

    const endpoint = `/api/plugins/google/sheets/share`;
    return this.makeRequest<GoogleSheetsShareResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async duplicateSheet(spreadsheetId: string, sheetId: number, newTitle?: string): Promise<GoogleSheetsDuplicateResponse> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      sheetId,
      newTitle: newTitle || `Copy of Sheet${sheetId}`
    };

    const endpoint = `/api/plugins/google/sheets/duplicate-sheet`;
    return this.makeRequest<GoogleSheetsDuplicateResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async protectRange(spreadsheetId: string, range: string, description: string, options?: {
    warningOnly?: boolean;
    requestingUserCanEdit?: boolean;
    editors?: string[];
  }): Promise<GoogleSheetsProtectResponse> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      range,
      description,
      warningOnly: options?.warningOnly || false,
      requestingUserCanEdit: options?.requestingUserCanEdit || true,
      editors: options?.editors || []
    };

    const endpoint = `/api/plugins/google/sheets/protect-range`;
    return this.makeRequest<GoogleSheetsProtectResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async addChart(spreadsheetId: string, sheetId: number, chartSpec: ChartSpec): Promise<GoogleSheetsChartResponse> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      sheetId,
      chartSpec
    };

    const endpoint = `/api/plugins/google/sheets/add-chart`;
    return this.makeRequest<GoogleSheetsChartResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getSpreadsheetMetadata(spreadsheetId: string): Promise<{ success: boolean; spreadsheet: Spreadsheet }> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      spreadsheetId
    });

    const endpoint = `/api/plugins/google/sheets/metadata?${queryParams.toString()}`;
    return this.makeRequest<{ success: boolean; spreadsheet: Spreadsheet }>(endpoint);
  }

  async addSheet(spreadsheetId: string, sheetConfig: SheetConfig): Promise<GoogleSheetsDuplicateResponse> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      sheetConfig
    };

    const endpoint = `/api/plugins/google/sheets/add-sheet`;
    return this.makeRequest<GoogleSheetsDuplicateResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<{ success: boolean }> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      sheetId
    };

    const endpoint = `/api/plugins/google/sheets/delete-sheet`;
    return this.makeRequest<{ success: boolean }>(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body)
    });
  }

  async updateSheetProperties(spreadsheetId: string, sheetId: number, properties: Partial<SheetConfig>): Promise<{ success: boolean; sheet: Sheet }> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      sheetId,
      properties
    };

    const endpoint = `/api/plugins/google/sheets/update-sheet-properties`;
    return this.makeRequest<{ success: boolean; sheet: Sheet }>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async formatCells(spreadsheetId: string, range: string, format: {
    backgroundColor?: { red: number; green: number; blue: number; alpha?: number };
    textFormat?: {
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      underline?: boolean;
      fontSize?: number;
      foregroundColor?: { red: number; green: number; blue: number; alpha?: number };
    };
    borders?: any;
    horizontalAlignment?: 'LEFT' | 'CENTER' | 'RIGHT';
    verticalAlignment?: 'TOP' | 'MIDDLE' | 'BOTTOM';
    numberFormat?: {
      type: 'TEXT' | 'NUMBER' | 'PERCENT' | 'CURRENCY' | 'DATE' | 'TIME' | 'DATE_TIME';
      pattern?: string;
    };
  }): Promise<{ success: boolean }> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      range,
      format
    };

    const endpoint = `/api/plugins/google/sheets/format-cells`;
    return this.makeRequest<{ success: boolean }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async batchUpdate(spreadsheetId: string, requests: any[]): Promise<{ success: boolean; replies: any[] }> {
    const body = {
      companyId: this.config.companyId,
      spreadsheetId,
      requests
    };

    const endpoint = `/api/plugins/google/sheets/batch-update`;
    return this.makeRequest<{ success: boolean; replies: any[] }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}