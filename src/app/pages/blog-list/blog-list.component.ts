import { Component, OnInit } from '@angular/core';
import { WordpressService } from '../../services/wordpress.service';
import { PostSimpleCard } from '../../types/wordpress.types';
import { SharedDataService } from '../../services/shared-data.service';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';

@Component({
  selector: 'app-blog-list',
  imports: [ScrollRevealDirective],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss'
})
export class BlogListComponent implements OnInit {
  constructor(private wp: WordpressService, private shared: SharedDataService, private date: DatePipe, private title: Title) {}
  posts: PostSimpleCard[] = [];
  ngOnInit(): void {
    this.title.setTitle("Xplora Travel || Blog");
    this.shared.setLoading(true);
    this.shared.changeHeaderType("dark");
    this.wp.getSimplePostCards({}).subscribe(posts=>{
      this.posts = posts.map(post=>{
        return {
          ...post,
          date: this.date.transform(post.date, 'mediumDate') || ''
        }
      });
      this.shared.setLoading(false);
    });
  }
}
