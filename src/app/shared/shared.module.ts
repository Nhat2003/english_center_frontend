import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ChatboxComponent } from './chatbox/chatbox.component';

@NgModule({
  declarations: [
    ChatboxComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzAvatarModule,
    NzBadgeModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule
  ],
  exports: [
    ChatboxComponent
  ]
})
export class SharedModule { }
