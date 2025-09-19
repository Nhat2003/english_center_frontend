import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { BreadcrumbComponent } from '../../../core/components/breadcrumb/breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [AdminLayoutComponent, BreadcrumbComponent],
  imports: [
    CommonModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    RouterModule
  ],
  exports: [AdminLayoutComponent, BreadcrumbComponent]
})
export class AdminLayoutModule {}
