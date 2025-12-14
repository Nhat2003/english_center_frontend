import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Lấy token từ AuthService
    const token = this.authService.getToken();

    console.log('AuthInterceptor - URL:', req.url);
    console.log('AuthInterceptor - Has Token:', !!token);
    console.log('AuthInterceptor - Body type:', req.body instanceof FormData ? 'FormData' : typeof req.body);

    // Nếu có token, thêm vào header
    if (token) {
      // Check if body is FormData - don't set Content-Type for FormData
      const isFormData = req.body instanceof FormData;
      let authReq;
      if (isFormData) {
        // For FormData, only add Authorization header
        console.log('AuthInterceptor - Adding Authorization header to FormData request');
        authReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // For JSON, add both Authorization and Content-Type
        console.log('AuthInterceptor - Adding Authorization and Content-Type headers to JSON request');
        authReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      return next.handle(authReq);
    }

    // Nếu không có token, gửi request bình thường
    console.log('AuthInterceptor - No token, sending request as-is');
    return next.handle(req);
  }
}
