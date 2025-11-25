// Mock para FormData
export class MockFormData {
  private data: Map<string, any> = new Map();

  append(key: string, value: any, options?: any) {
    this.data.set(key, { value, options });
  }

  getHeaders() {
    return {
      'content-type': 'multipart/form-data; boundary=mock-boundary',
    };
  }

  getData() {
    return this.data;
  }
}

export default MockFormData;
