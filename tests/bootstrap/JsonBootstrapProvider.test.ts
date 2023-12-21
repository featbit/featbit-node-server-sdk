import { JsonBootstrapProvider } from "../../src/bootstrap/JsonBootstrapProvider";
import testData from "./featbit-bootstrap.json";
import DataSourceUpdates from "../../src/data_sources/DataSourceUpdates";
import { IStore } from "../../src/store/store";
import InMemoryStore from "../../src/store/InMemoryStore";
import DataKinds from "../../src/store/DataKinds";

describe('given a JsonBootstrapProvider', () => {
  it('use valid json', () => {
    const json = JSON.stringify(testData);
    const provider = new JsonBootstrapProvider(json);

    expect(provider).not.toBeNull();
  });

  it('use invalid json', () => {
    const json = '{';

    expect(() => new JsonBootstrapProvider(json)).toThrow();
  });

  it('populate store', async () => {
    const json = JSON.stringify(testData);
    const provider = new JsonBootstrapProvider(json);
    const store: IStore = new InMemoryStore();

    const dataSourceUpdates = new DataSourceUpdates(store, () => false, () => {})

    await provider.populate(dataSourceUpdates);

    const flag = store.get(DataKinds.Flags, 'example-flag');
    const segment = store.get(DataKinds.Segments, '0779d76b-afc6-4886-ab65-af8c004273ad');

    expect(flag).not.toBeNull();
    expect(segment).not.toBeNull();
  });
});