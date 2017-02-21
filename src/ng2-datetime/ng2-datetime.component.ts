import {
    Component, Output, Input, EventEmitter, HostListener, AfterViewInit, OnDestroy,
    SimpleChanges, OnChanges
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { TimepickerEvent } from './timepicker-event-interface';

@Component({
    selector: 'datetime',
    template: `
    <div class="form-inline">
        <div id="{{idDatePicker}}" class="input-group date">
            <input type="text" class="form-control"
                   [required]="required || null"
                   [disabled]="disabled || null"
                   [attr.placeholder]="datepickerOptions.placeholder || 'Choose date'"
                   [(ngModel)]="dateModel"
                   (keyup)="checkEmptyValue($event)"/>
            <div class="input-group-addon" [class.disabled]="disabled">
                <span [ngClass]="datepickerOptions.icon || 'fa fa-calendar'" [class.disabled]="disabled"></span>
            </div>
        </div>
        <div class="input-group bootstrap-timepicker timepicker">
            <input id="{{idTimePicker}}" type="text" class="form-control input-small" 
                   [required]="required || null"
                   [disabled]="disabled || null"
                   [attr.placeholder]="timepickerOptions.placeholder || 'Set time'"
                   [(ngModel)]="timeModel"
                   (keyup)="checkEmptyValue($event)">
            <span class="input-group-addon" [class.disabled]="disabled">
                <i [ngClass]="timepickerOptions.icon || 'fa fa-clock-o'" [class.disabled]="disabled"></i>
            </span>
        </div>
        <button *ngIf="hasClearButton" type="button" (click)="clearModels()">Clear</button>
    </div>
   `,
    styles: ['.invalidInput { border: solid 1.5px red; } .disabled {pointer-events: none}']
})

export class NKDatetimeComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, OnChanges {
    @Output() public dateChange: EventEmitter<Date> = new EventEmitter<Date>();
    @Input('timepickerOptions') public timepickerOptions: any = {};
    @Input('datepickerOptions') public datepickerOptions: any = {};
    @Input('hasClearButton') public hasClearButton: boolean = false;
    @Input() public disabled: boolean = null;
    @Input() public required: boolean = null;

    public date: Date; // ngModel
    public dateModel: string;
    public timeModel: string;

    // instances
    public datepicker: any;
    public timepicker: any;

    public idDatePicker: string = uniqueId('q-datepicker_');
    public idTimePicker: string = uniqueId('q-timepicker_');

    @HostListener('dateChange', ['$event'])
    /* tslint:disable */
    onChange = (_: any) => {
    };
    onTouched = () => {
    };
    /* tslint:enabled */

    constructor(private ngControl: NgControl) {
        ngControl.valueAccessor = this; // override valueAccessor
    }

    public ngAfterViewInit() {
        this.init();
    }

    public ngOnDestroy() {
        if (this.datepicker) {
            this.datepicker.datepicker('destroy');
        }
        if (this.timepicker) {
            this.timepicker.timepicker('remove');
        }
    }

    public ngOnChanges(changes: SimpleChanges) {
        if (changes) {
            if (changes['datepickerOptions'] && this.datepicker) {
                this.datepicker.datepicker('destroy');

                if (changes['datepickerOptions'].currentValue) {
                    this.datepicker = null;
                    this.init();
                } else if (changes['datepickerOptions'].currentValue === false) {
                    this.datepicker.remove();
                }
            }
            if (changes['timepickerOptions'] && this.timepicker) {
                this.timepicker.timepicker('remove');

                if (changes['timepickerOptions'].currentValue) {
                    this.timepicker = null;
                    this.init();
                } else if (changes['timepickerOptions'].currentValue === false) {
                    this.timepicker.parent().remove();
                }
            }
        }
    }

    public writeValue(value: any): void {
        this.date = value;
        if (isDate(this.date)) {
            setTimeout(() => {
                this.updateModel(this.date);
            }, 0);
        } else {
            this.clearModels();
        }
    }

    public registerOnChange(fn: (_: any) => void): void {
        this.onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    public checkEmptyValue(e: any) {
        const value = e.target.value;
        if (value === '' && (
                this.timepickerOptions === false ||
                this.datepickerOptions === false ||
                (this.timeModel === '' && this.dateModel === '')
            )) {
            this.dateChange.emit(null);
        }
    }

    public clearModels() {
        this.dateChange.emit(null);
        if (this.timepicker) {
            this.timepicker.timepicker('setTime', null);
        }
        this.updateDatepicker(null);
    }

    //////////////////////////////////

    private init(): void {
        if (!this.datepicker && this.datepickerOptions !== false) {
            let options = jQuery.extend({ enableOndisabled: !this.disabled }, this.datepickerOptions);
            this.datepicker = (<any>$('#' + this.idDatePicker)).datepicker(options);
            this.datepicker
                .on('changeDate', (e: any) => {
                    let newDate: Date = e.date;

                    if (isDate(this.date) && isDate(newDate)) {
                        // get hours/minutes
                        newDate.setHours(this.date.getHours());
                        newDate.setMinutes(this.date.getMinutes());
                    }

                    this.date = newDate;
                    this.dateChange.emit(newDate);
                });
        } else if (this.datepickerOptions === false) {
            (<any>$('#' + this.idDatePicker)).remove();
        }

        if (!this.timepicker && this.timepickerOptions !== false) {
            let options = jQuery.extend({ defaultTime: false }, this.timepickerOptions);
            this.timepicker = (<any>$('#' + this.idTimePicker)).timepicker(options);
            this.timepicker
                .on('changeTime.timepicker', (e: TimepickerEvent) => {
                    if (this.disabled) {
                        return false;
                    }

                    let { meridian, hours } = e.time;

                    if (meridian) {
                        // has meridian -> convert 12 to 24h
                        if (meridian === 'PM' && hours < 12) {
                            hours = hours + 12;
                        }
                        if (meridian === 'AM' && hours === 12) {
                            hours = hours - 12;
                        }
                        hours = parseInt(this.pad(hours), 10);
                    }

                    if (!isDate(this.date)) {
                        this.date = new Date();
                        this.updateDatepicker(this.date);
                    }

                    this.date.setHours(hours);
                    this.date.setMinutes(e.time.minutes);
                    this.dateChange.emit(this.date);
                });
        } else if (this.timepickerOptions === false) {
            (<any>$('#' + this.idTimePicker)).parent().remove();
        }

        this.updateModel(this.date);
    }

    private updateModel(date: Date): void {
        this.updateDatepicker(date);

        // update timepicker
        if (this.timepicker !== undefined && isDate(date)) {
            let hours = date.getHours();
            if (this.timepickerOptions.showMeridian) {
                // Convert 24 to 12 hour system
                hours = (hours === 0 || hours === 12) ? 12 : hours % 12;
            }
            const meridian = date.getHours() >= 12 ? ' PM' : ' AM';
            const time =
                this.pad(hours) + ':' +
                this.pad(this.date.getMinutes()) +
                (this.timepickerOptions.showMeridian || this.timepickerOptions.showMeridian === undefined
                    ? meridian : '');
            this.timepicker.timepicker('setTime', time);
            this.timeModel = time; // fix initial empty timeModel bug
        }
    }

    private updateDatepicker(date?: any) {
        if (this.datepicker !== undefined) {
            this.datepicker.datepicker('update', date);
        }
    }

    private pad(value: any): string {
        return value.toString().length < 2 ? '0' + value : value.toString();
    }
}

let id = 0;
function uniqueId(prefix: string): string {
    return prefix + ++id;
}

function isDate(obj: any) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}