import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DemoApiService } from "../../core/demo-api.service";

import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { finalize } from "rxjs";


@Component({
  selector: 'secret',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './secret.html',
  styleUrls: ['./secret.css'],
  standalone: true,
})

export class SecretPage {
    private fb = inject(FormBuilder);
    private authService = inject(DemoApiService);
    private router = inject(Router)
    private toastr = inject(ToastrService);
    protected isLoading: boolean = false;

    form = this.fb.group({
        password: ['',Validators.required]
    })

    constructor() {
    }


    login() {
        this.isLoading = true;
        const val = this.form.value;
        if (val.password) {
            this.authService.postSecret(val.password)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: () => {
                    this.router.navigateByUrl('/s/secret');
                    this.isLoading = false
                },
                error: (err) => {
                    if (err.status === 429) {
                        this.toastr.error("Too many attempts, please wait and try again");
                    } else {
                        this.toastr.error("Authentication Failed");
                    }
                }
            })
        }
    }
}