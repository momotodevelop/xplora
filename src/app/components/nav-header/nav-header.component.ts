import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-header.component.html',
  styleUrl: './nav-header.component.scss'
})
export class NavHeaderComponent implements OnInit, AfterViewInit {
  headerType:HeaderType="light";
  @ViewChild('header', {read: ElementRef, static:false}) headerElement!: ElementRef;
  constructor(public shared: SharedDataService){}
  ngOnInit(): void {
    this.shared.headerType.subscribe({next: (type:HeaderType)=>{this.headerType=type}});
  }
  ngAfterViewInit(): void {
    this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
  }
}
