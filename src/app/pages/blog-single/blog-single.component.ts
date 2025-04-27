import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WordpressService } from '../../services/wordpress.service';
import { SharedDataService } from '../../services/shared-data.service';
import { PostDetail } from '../../types/wordpress.types';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-blog-single',
  imports: [],
  templateUrl: './blog-single.component.html',
  styleUrl: './blog-single.component.scss'
})
export class BlogSingleComponent implements OnInit{
  constructor(private route: ActivatedRoute, private wp: WordpressService, private shared: SharedDataService, private date: DatePipe){}
  post?: PostDetail;
  ngOnInit(): void {
    this.shared.changeHeaderType("dark");
    this.route.params.subscribe(params => {
      const id = params['id'];
      console.log(id);
      this.wp.getPostDetail(id).subscribe(post=>{
        console.log(post.featuredMediaUrl);
        this.post = {
          ...post,
          date: this.date.transform(post.date, 'longDate') || ''
        };
      });
    });
  }
}
