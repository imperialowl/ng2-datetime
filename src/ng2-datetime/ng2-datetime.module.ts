import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NKDatetimeComponent } from './ng2-datetime.component';

@NgModule({
    imports: [CommonModule, FormsModule],
    exports: [NKDatetimeComponent],
    declarations: [NKDatetimeComponent]
})
export class NKDatetimeModule {
}
