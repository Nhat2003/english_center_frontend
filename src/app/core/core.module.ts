import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [
    BreadcrumbComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NzBreadCrumbModule
  ],
  exports: [
    BreadcrumbComponent
  ]
})
export class CoreModule { }
