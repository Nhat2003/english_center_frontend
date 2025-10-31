import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('AuthInterceptor: Intercepting request to:', req.url);
    console.log('AuthInterceptor: Request method:', req.method);
    console.log('AuthInterceptor: Request body:', req.body);

    // Lấy token từ AuthService
    const token = this.authService.getToken();
    console.log('AuthInterceptor: Token exists:', !!token);

    // Nếu có token, thêm vào header
    if (token) {
      console.log('AuthInterceptor: Adding Authorization header');

      // Check if body is FormData - don't set Content-Type for FormData
      const isFormData = req.body instanceof FormData;
      console.log('AuthInterceptor: Is FormData?', isFormData);

      let authReq;
      if (isFormData) {
        // For FormData, only add Authorization header
        authReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // For JSON, add both Authorization and Content-Type
        authReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('AuthInterceptor: Final request body:', authReq.body);
      console.log('AuthInterceptor: Request headers:', authReq.headers.keys());
      return next.handle(authReq);
    }

    console.log('AuthInterceptor: No token, sending request without auth header');
    // Nếu không có token, gửi request bình thường
    return next.handle(req);
  }
}
