import axios from 'axios';

class AxiosInstanceByUrl {
  private instances: { [key: string]: any } = {};

  createInstance(url: string) {
    this.instances[url] = axios.create({
      baseURL: url,
      withCredentials: true,
    });

    this.instances[url].interceptors.request.use((config: any) => {
      return config;
    });
  }

  getInstance(url: string) {
    if (!this.instances[url]) {
      this.instances[url] = axios.create({
        baseURL: url,
        withCredentials: true,
      });

      this.instances[url].interceptors.request.use((config: any) => {
        return config;
      });
    }
    return this.instances[url];
  }
}

const axiosClass = new AxiosInstanceByUrl();

export default axiosClass;
