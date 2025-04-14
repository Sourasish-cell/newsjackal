import React, { Component } from 'react'
import Newsitem from './Newsitem'
import { ThemeContext } from '../context/ThemeContext'
import Spinner from './spinner'
import PropTypes from 'prop-types'
import { sampleArticles } from '../data/sampleData'
import InfiniteScroll from 'react-infinite-scroll-component'

// API base URL - points directly to Flask backend
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export class News extends Component {
  static contextType = ThemeContext;
  static defaultProps = {
    pageSize: 9,
    category: 'general'
  }

  static propTypes = {
    pageSize: PropTypes.number,
    category: PropTypes.string,
    setProgress: PropTypes.func
  }

  constructor(props){
    super(props);
    this.state = {
      articles: sampleArticles,
      loading: false,
      page: 1,
      totalResults: sampleArticles.length,
      apiError: false,
      errorMessage: "",
      errorShown: false,
      hasMore: true,
      backendAvailable: false,
      sources: [],
      selectedSource: '' // Empty string means 'all sources'
    }
    document.title = `${this.capitalizeFirstLetter(this.props.category)} - NewsJackal`;
  }

  async componentDidMount(){
    if (this.props.setProgress) {
      this.props.setProgress(10);
    }

    // Check if backend is available
    try {
      console.log("Checking backend health...");
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        console.log("Backend is available!");
        this.setState({ backendAvailable: true });
        
        // Fetch available sources
        await this.fetchSources();
        
        // Fetch news
        await this.fetchNews();
      } else {
        console.error("Backend server is not responding properly");
        this.setState({ 
          backendAvailable: false,
          apiError: true,
          errorMessage: "Backend server is not responding properly"
        });
      }
    } catch (error) {
      console.error("Backend connection error:", error);
      this.setState({ 
        backendAvailable: false,
        apiError: true,
        errorMessage: "Backend server is not available. Please start the backend server."
      });
    }

    if (this.props.setProgress) {
      this.props.setProgress(100);
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.category !== this.props.category) {
      document.title = `${this.capitalizeFirstLetter(this.props.category)} - NewsJackal`;

      if (this.props.setProgress) {
        this.props.setProgress(10);
      }

      this.setState({ page: 1, articles: [], errorShown: false, hasMore: true }, () => {
        this.fetchNews();
      });
    }
  }

  fetchSources = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sources`);
      const sources = await response.json();
      this.setState({ sources });
    } catch (error) {
      console.error("Error fetching sources:", error);
    }
  }

  handleSourceChange = (e) => {
    const selectedSource = e.target.value;
    this.setState({ 
      selectedSource,
      page: 1,
      articles: [],
      errorShown: false,
      hasMore: true 
    }, () => {
      this.fetchNews();
    });
  }

  fetchNews = async () => {
    this.setState({loading: true});

    if (!this.state.backendAvailable) {
      this.setState({
        articles: sampleArticles,
        totalResults: sampleArticles.length,
        loading: false,
        apiError: true,
        errorMessage: "Backend server is not available. Please start the backend server.",
        errorShown: false,
        hasMore: false
      });
      return;
    }

    let apiEndpoint = `${API_BASE}/api/top-headlines`;
    let queryParams = new URLSearchParams();

    if (this.props.category) {
      queryParams.append('category', this.props.category);
    }

    // Add source parameter if a specific source is selected
    if (this.state.selectedSource) {
      queryParams.append('source', this.state.selectedSource);
    }

    queryParams.append('page', this.state.page);
    queryParams.append('pageSize', this.props.pageSize);

    const url = `${apiEndpoint}?${queryParams.toString()}`;
    console.log("Fetching from:", url);

    try {
      let data = await fetch(url);
      let parsedData = await data.json();
      console.log("Received data:", parsedData);

      if (parsedData.status === "ok" && parsedData.articles && parsedData.articles.length > 0) {
        if (this.state.page === 1) {
          this.setState({
            articles: parsedData.articles, 
            totalResults: parsedData.totalResults,
            loading: false,
            apiError: false,
            errorMessage: "",
            errorShown: false,
            hasMore: parsedData.articles.length < parsedData.totalResults
          }, () => {
            if (this.props.setProgress) {
              this.props.setProgress(100);
            }
          });
        } else {
          this.setState(prevState => ({
            articles: [...prevState.articles, ...parsedData.articles],
            totalResults: parsedData.totalResults,
            loading: false,
            apiError: false,
            errorMessage: "",
            hasMore: prevState.articles.length + parsedData.articles.length < parsedData.totalResults
          }), () => {
            if (this.props.setProgress) {
              this.props.setProgress(100);
            }
          });
        }
      } else {
        console.error("No articles found or API error:", parsedData.message);
        this.setState({
          articles: sampleArticles,
          totalResults: sampleArticles.length,
          loading: false,
          apiError: true,
          errorMessage: parsedData.message || "No articles found",
          errorShown: false,
          hasMore: false
        }, () => {
          if (this.props.setProgress) {
            this.props.setProgress(100);
          }
        });
      }
    } catch (error) {
      console.error("Network error or API unavailable:", error);
      this.setState({
        articles: sampleArticles,
        totalResults: sampleArticles.length,
        loading: false,
        apiError: true,
        errorMessage: "Network error or API unavailable. Please check if the backend server is running.",
        errorShown: false,
        hasMore: false
      }, () => {
        if (this.props.setProgress) {
          this.props.setProgress(100);
        }
      });
    }
  }

  fetchMoreData = async () => {
    if (this.state.hasMore) {
      this.setState({ page: this.state.page + 1 }, () => {
        this.fetchNews();
      });
    }
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  render() {
    const { darkMode } = this.context;

    if (this.state.apiError && !this.state.errorShown) {
      setTimeout(() => {
        this.setState({ errorShown: true });
      }, 0);
    }

    return (
      <div className={`container my-3 ${darkMode ? 'text-light' : ''}`}>
        <h1 className="text-center" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <strong>NewsJackal - Top {this.capitalizeFirstLetter(this.props.category)} Headlines</strong>
        </h1>

        {/* Source selector */}
        {this.state.sources.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-6 mx-auto">
              <div className="input-group">
                <div className="input-group-prepend">
                  <label className="input-group-text" htmlFor="sourceSelector"><strong>News Source</strong></label>
                </div>
                <select 
                  className={`form-select ${darkMode ? 'bg-dark text-light' : ''}`} 
                  id="sourceSelector"
                  value={this.state.selectedSource}
                  onChange={this.handleSourceChange}
                >
                  <option value="">All Sources</option>
                  {this.state.sources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {this.state.apiError && !this.state.errorShown && (
          <div className="alert alert-warning" role="alert">
            <strong>API Error:</strong> {this.state.errorMessage}. Showing sample data instead.
          </div>
        )}

        <InfiniteScroll
          dataLength={this.state.articles.length}
          next={this.fetchMoreData}
          hasMore={this.state.hasMore}
          loader={<Spinner />}
        >
          <div className="row">
            {this.state.articles && this.state.articles.map((element, index) => {
              return (
                <div className="col-md-4 mb-4" key={element.url || index}>
                  <Newsitem 
                    title={element.title || ""} 
                    description={element.description || ""} 
                    imageUrl={element.urlToImage} 
                    newsUrl={element.url} 
                    darkMode={darkMode}
                    author={element.author}
                    date={element.publishedAt}
                    source={element.source?.name || "Unknown"}
                  />
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      </div>
    );
  }
}

export default News
