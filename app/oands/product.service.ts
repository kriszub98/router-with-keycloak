// product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface ProductDTO {
  id: string;
  name: string;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  search(term: string): Observable<ProductDTO[]> {
    if (!term || term.length < 3) return of([]);
    // podmień URL i parametry wg API
    return this.http.get<ProductDTO[]>('/api/products', { params: { q: term } });
  }
}
