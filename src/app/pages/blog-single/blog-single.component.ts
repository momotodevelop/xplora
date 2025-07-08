import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WordpressService } from '../../services/wordpress.service';
import { SharedDataService } from '../../services/shared-data.service';
import { PostDetail } from '../../types/wordpress.types';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';

@Component({
  selector: 'app-blog-single',
  imports: [ScrollRevealDirective],
  templateUrl: './blog-single.component.html',
  styleUrl: './blog-single.component.scss'
})
export class BlogSingleComponent implements OnInit{
  constructor(
    private route: ActivatedRoute, 
    private wp: WordpressService, 
    private shared: SharedDataService,
    private date: DatePipe,
    private title: Title
  ){}
  post?: PostDetail;
  ngOnInit(): void {
    this.title.setTitle("Xplora Travel || Blog");
    this.shared.changeHeaderType("dark");
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.wp.getPostDetail(id).subscribe(post=>{
        this.title.setTitle(`Xplora Travel || ${post.title}`);
        this.post = {
          ...post,
          date: this.date.transform(post.date, 'longDate') || ''
        };
      });
    });
  }
}
