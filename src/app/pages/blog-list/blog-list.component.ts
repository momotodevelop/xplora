import { Component, OnInit } from '@angular/core';
import { WordpressService } from '../../services/wordpress.service';
import { PostSimpleCard } from '../../types/wordpress.types';
import { SharedDataService } from '../../services/shared-data.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-blog-list',
  imports: [],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss'
})
export class BlogListComponent implements OnInit {
  constructor(private wp: WordpressService, private shared: SharedDataService, private date: DatePipe) {}
  posts: PostSimpleCard[] = [];
  ngOnInit(): void {
    this.shared.setLoading(true);
    this.shared.changeHeaderType("dark");
    this.wp.getSimplePostCards({}).subscribe(posts=>{
      //console.log(posts[0].id);
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
