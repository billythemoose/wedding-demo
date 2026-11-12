import { Component, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

import { E164Validator } from "../../core/validators";
import { DemoApiService } from "../../core/demo-api.service";
import { CommonModule } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { finalize, forkJoin } from "rxjs";

type PersonFormGroup = FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    phone: FormControl<string>;
    attending: FormControl<boolean>;
}>

@Component({
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class RegisterPage {
    private fb = inject(NonNullableFormBuilder)
    private api = inject(DemoApiService);
    private toastr = inject(ToastrService)

    plusOne: boolean = false; 
    isLoading: boolean = false;

    form = this.fb.group({
        people: this.fb.array<PersonFormGroup>([])
    })

    constructor() {
        this.createPerson();
    }

    get people(): FormArray {
        return this.form.get('people') as FormArray;
    }

    changeCount(addOne: boolean) {
        this.plusOne = addOne
        
        if (this.plusOne) {
            this.createPerson()
        } else if (this.people.length > 1) {
            this.people.removeAt(this.people.length-1)
        }
    }

    groupFromControl(control: AbstractControl): FormGroup {
        return control as FormGroup;
    }

    private createPerson(): void {
        const person = this.fb.group({
            firstName: this.fb.control('', Validators.required),
            lastName: this.fb.control('', Validators.required),
            phone: this.fb.control('', [
                Validators.required,
                E164Validator('US')
            ]),
            attending: this.fb.control(true, Validators.required)
        });
        this.people.push(person)
    }

    submit() {
        const people = this.form.getRawValue().people ?? [];
        if (people.length === 0) {
            return;
        }

        // TODO: can partially succeed 
        this.isLoading = true;
        forkJoin(
            people.map((p) => this.api.putRsvp(p.firstName, p.lastName, p.phone, p.attending)),
            ).pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: () => this.toastr.success('Registration successful!'),
                error: (err) => {
                    if (err.status === 401) {
                        this.toastr.error('Please log in again');
                    } else {
                        this.toastr.error('Registration failed');
                    }
                },
            });
    }
}
