import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

export interface MenuLink {
    label: string;
    path: string;
}

@Component({
    selector: 'header-menu',
    imports: [RouterLink],
    templateUrl: './header-menu.html',
    styleUrls: ['./header-menu.css']
})

export class HeaderMenu {

    links = input.required<MenuLink[]>();

    isOpen = false;


    dropdown(): void {
        this.isOpen = !this.isOpen;
    }
}
